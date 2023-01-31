drop table if exists campaign cascade;
create table campaign (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    -- Campaign details
    name text not null,
    user_id uuid references auth.users not null,
    keywords text[] not null,
    
    -- Campaign filters
    filters jsonb not null default '{}',

    -- Status
    latest_tweet_id bigint references tweet,
    paused boolean not null default false,
    deleted boolean not null default false,

    -- For quotas and rate limits
    last_run_at timestamp with time zone,
    tweets_fetched_today integer not null default 0,
);

create trigger on_campaign_updated
  before update on campaign
  for each row execute procedure set_updated_at();

alter table campaign enable row level security;

create policy "Users can insert their own campaigns."
  on campaign for insert
  to authenticated
  with check ( auth.uid() = user_id );

create policy "Users can view their own campaigns."
  on campaign for select
  to authenticated
  using ( auth.uid() = user_id );

create policy "Users can update their own campaigns."
  on campaign for update
  to authenticated
  using ( auth.uid() = user_id );

alter publication supabase_realtime add table campaign;
alter table campaign replica identity full;

-- Campaign x Entity association table

drop table if exists campaign_entity cascade;
create table campaign_entity (
    campaign_id bigint references campaign on delete cascade not null,
    entity_id bigint references entity not null,
    primary key (campaign_id, entity_id)
);

alter table campaign_entity enable row level security;

create policy "Users can insert entities to their own campaigns."
  on campaign_entity for insert
  to authenticated
  with check (
      auth.uid() in (
      select campaign.user_id from campaign
      where campaign_entity.campaign_id = campaign.id
  ));;

create policy "Users can view entities of their own campaigns."
  on campaign_entity for select
  using (
      auth.uid() in (
      select campaign.user_id from campaign
      where campaign_entity.campaign_id = campaign.id
  ));

create policy "Users can update entities of their own campaigns."
  on campaign_entity for update
  using (
      auth.uid() in (
      select campaign.user_id from campaign
      where campaign_entity.campaign_id = campaign.id
  ));

create policy "Users can delete entities of their own campaigns."
  on campaign_entity for delete
  using (
      auth.uid() in (
      select campaign.user_id from campaign
      where campaign_entity.campaign_id = campaign.id
  ));

-- Get campaign profiles

drop function if exists get_campaign_profiles(bigint) cascade;
create function get_campaign_profiles(campaign_id bigint) returns setof twitter_profile as $$

with 
  campaign as (select keywords,filters from campaign where id = campaign_id),
  campaign_entities as (
    select entity_id from campaign_entity
      where campaign_entity.campaign_id = get_campaign_profiles.campaign_id
  )

select distinct twitter_profile.* from
twitter_profile
  left join tweet on tweet.author_id = twitter_profile.id
  left join tweet_entity on tweet_entity.tweet_id = tweet.id

where 
  -- Campaign keywords and niches
  ((cardinality((select keywords from campaign)) > 0 and
    tweet.text ~* array_to_string((select keywords from campaign), '|')) or 
    tweet_entity.entity_id in (select * from campaign_entities)) and

  -- Profile filters
  ((select filters->'followersCountLessThan' from campaign) is null or
    twitter_profile.followers_count <
      (select(filters->'followersCountLessThan')::integer from campaign)) and

  ((select filters->'followersCountGreaterThan' from campaign) is null or
    twitter_profile.followers_count >
      (select(filters->'followersCountGreaterThan')::integer from campaign)) and

  ((select filters->'tweetCountLessThan' from campaign) is null or
    twitter_profile.tweet_count <
      (select(filters->'tweetCountLessThan')::integer from campaign)) and

  ((select filters->'tweetCountGreaterThan' from campaign) is null or
    twitter_profile.tweet_count >
      (select(filters->'tweetCountGreaterThan')::integer from campaign)) and

  ((select filters->'followingCountLessThan' from campaign) is null or
    twitter_profile.following_count <
      (select(filters->'followingCountLessThan')::integer from campaign)) and

  ((select filters->'followingCountGreaterThan' from campaign) is null or
    twitter_profile.following_count >
      (select(filters->'followingCountGreaterThan')::integer from campaign)) and

  ((select filters->'userCreatedBefore' from campaign) is null or
    twitter_profile.user_created_at <
      (select(filters->>'userCreatedBefore')::timestamptz from campaign)) and

  ((select filters->'userCreatedAfter' from campaign) is null or
    twitter_profile.user_created_at >
      (select(filters->>'userCreatedAfter')::timestamptz from campaign)) and

  ((select filters->'userSearchText' from campaign) is null or
    concat(twitter_profile.name, twitter_profile.description) ~*
      (select(filters->'userSearchText')::text from campaign)) and

  -- Tweet filters
  ((select filters->'retweetCountLessThan' from campaign) is null or
    tweet.retweet_count <
      (select(filters->'retweetCountLessThan')::integer from campaign)) and

  ((select filters->'retweetCountGreaterThan' from campaign) is null or
    tweet.retweet_count >
      (select(filters->'retweetCountGreaterThan')::integer from campaign)) and

  ((select filters->'likeCountLessThan' from campaign) is null or
    tweet.like_count <
      (select(filters->'likeCountLessThan')::integer from campaign)) and

  ((select filters->'likeCountGreaterThan' from campaign) is null or
    tweet.like_count >
      (select(filters->'likeCountGreaterThan')::integer from campaign)) and

  ((select filters->'quoteCountLessThan' from campaign) is null or
    tweet.quote_count <
      (select(filters->'quoteCountLessThan')::integer from campaign)) and

  ((select filters->'quoteCountGreaterThan' from campaign) is null or
    tweet.quote_count >
      (select(filters->'quoteCountGreaterThan')::integer from campaign)) and

  ((select filters->'replyCountLessThan' from campaign) is null or
    tweet.reply_count <
      (select(filters->'replyCountLessThan')::integer from campaign)) and

  ((select filters->'replyCountGreaterThan' from campaign) is null or
    tweet.reply_count >
      (select(filters->'replyCountGreaterThan')::integer from campaign)) and

  ((select filters->'tweetCreatedBefore' from campaign) is null or
    tweet.tweet_created_at <
      (select(filters->>'tweetCreatedBefore')::timestamptz from campaign)) and

  ((select filters->'tweetCreatedAfter' from campaign) is null or
    tweet.tweet_created_at >
      (select(filters->>'tweetCreatedAfter')::timestamptz from campaign)) and

  ((select filters->'tweetSearchText' from campaign) is null or
    tweet.text ~*
      (select(filters->'tweetSearchText')::text from campaign))
;

$$ language sql;


-- Get campaign tweets

drop function if exists get_campaign_tweets(bigint) cascade;
create function get_campaign_tweets(campaign_id bigint)
  returns table(
    id bigint,
    text text,
    tweet_created_at timestamp with time zone,
    like_count integer,
    retweet_count integer,
    quote_count integer,
    reply_count integer,
    author_id bigint,
    author_username text,
    author_name text,
    author_profile_image_url text
  ) as $$

with 
  campaign as (select keywords,filters from campaign where id = campaign_id),
  campaign_entities as (
    select entity_id from campaign_entity
      where campaign_entity.campaign_id = get_campaign_tweets.campaign_id
  )

select
  distinct tweet.id,
    tweet.text,
    tweet.tweet_created_at,
    tweet.like_count,
    tweet.retweet_count,
    tweet.quote_count,
    tweet.reply_count,
    tweet.author_id,
    twitter_profile.username as author_username,
    twitter_profile.name as author_name,
    twitter_profile.profile_image_url as author_profile_image_url
from tweet
  left join tweet_entity on tweet_entity.tweet_id = tweet.id
  left join twitter_profile on tweet.author_id = twitter_profile.id

where 
  -- Campaign keywords and niches
  ((cardinality((select keywords from campaign)) > 0 and
    tweet.text ~* array_to_string((select keywords from campaign), '|')) or 
    tweet_entity.entity_id in (select * from campaign_entities)) and

  -- Profile filters
  ((select filters->'followersCountLessThan' from campaign) is null or
    twitter_profile.followers_count <
      (select(filters->'followersCountLessThan')::integer from campaign)) and

  ((select filters->'followersCountGreaterThan' from campaign) is null or
    twitter_profile.followers_count >
      (select(filters->'followersCountGreaterThan')::integer from campaign)) and

  ((select filters->'tweetCountLessThan' from campaign) is null or
    twitter_profile.tweet_count <
      (select(filters->'tweetCountLessThan')::integer from campaign)) and

  ((select filters->'tweetCountGreaterThan' from campaign) is null or
    twitter_profile.tweet_count >
      (select(filters->'tweetCountGreaterThan')::integer from campaign)) and

  ((select filters->'followingCountLessThan' from campaign) is null or
    twitter_profile.following_count <
      (select(filters->'followingCountLessThan')::integer from campaign)) and

  ((select filters->'followingCountGreaterThan' from campaign) is null or
    twitter_profile.following_count >
      (select(filters->'followingCountGreaterThan')::integer from campaign)) and

  ((select filters->'userCreatedBefore' from campaign) is null or
    twitter_profile.user_created_at <
      (select(filters->>'userCreatedBefore')::timestamptz from campaign)) and

  ((select filters->'userCreatedAfter' from campaign) is null or
    twitter_profile.user_created_at >
      (select(filters->>'userCreatedAfter')::timestamptz from campaign)) and

  ((select filters->'userSearchText' from campaign) is null or
    concat(twitter_profile.name, twitter_profile.description) ~*
      (select(filters->'userSearchText')::text from campaign)) and

  -- Tweet filters
  ((select filters->'retweetCountLessThan' from campaign) is null or
    tweet.retweet_count <
      (select(filters->'retweetCountLessThan')::integer from campaign)) and

  ((select filters->'retweetCountGreaterThan' from campaign) is null or
    tweet.retweet_count >
      (select(filters->'retweetCountGreaterThan')::integer from campaign)) and

  ((select filters->'likeCountLessThan' from campaign) is null or
    tweet.like_count <
      (select(filters->'likeCountLessThan')::integer from campaign)) and

  ((select filters->'likeCountGreaterThan' from campaign) is null or
    tweet.like_count >
      (select(filters->'likeCountGreaterThan')::integer from campaign)) and

  ((select filters->'quoteCountLessThan' from campaign) is null or
    tweet.quote_count <
      (select(filters->'quoteCountLessThan')::integer from campaign)) and

  ((select filters->'quoteCountGreaterThan' from campaign) is null or
    tweet.quote_count >
      (select(filters->'quoteCountGreaterThan')::integer from campaign)) and

  ((select filters->'replyCountLessThan' from campaign) is null or
    tweet.reply_count <
      (select(filters->'replyCountLessThan')::integer from campaign)) and

  ((select filters->'replyCountGreaterThan' from campaign) is null or
    tweet.reply_count >
      (select(filters->'replyCountGreaterThan')::integer from campaign)) and

  ((select filters->'tweetCreatedBefore' from campaign) is null or
    tweet.tweet_created_at <
      (select(filters->>'tweetCreatedBefore')::timestamptz from campaign)) and

  ((select filters->'tweetCreatedAfter' from campaign) is null or
    tweet.tweet_created_at >
      (select(filters->>'tweetCreatedAfter')::timestamptz from campaign)) and

  ((select filters->'tweetSearchText' from campaign) is null or
    tweet.text ~*
      (select(filters->'tweetSearchText')::text from campaign))
;

$$ language sql;

-- Get campaign counts

drop function if exists get_campaign_counts(bigint) cascade;
create function get_campaign_counts(campaign_id bigint)
  returns table(
    profile_count bigint,
    tweet_count bigint
  ) as $$

with 
  campaign as (select keywords,filters from campaign where id = campaign_id),
  campaign_entities as (
    select entity_id from campaign_entity
      where campaign_entity.campaign_id = get_campaign_tweets.campaign_id
  )

select
  count(distinct tweet.id) as tweet_count, count(distinct twitter_profile.id) as profile_count
from tweet
  left join tweet_entity on tweet_entity.tweet_id = tweet.id
  left join twitter_profile on tweet.author_id = twitter_profile.id
where 
  ((cardinality((select keywords from campaign)) > 0 and
    tweet.text ~* array_to_string((select keywords from campaign), '|')) or 
    tweet_entity.entity_id in (select * from campaign_entities))
;

$$ language sql;
