-- Search twitter profiles using filters

create function search_twitter_profiles (
  -- Arguments
  reference_user bigint default null,
  follower_of text[] default null,
  followed_by text[] default null,
  muted_by text[] default null,
  blocked_by text[] default null
  ) returns table (
    -- Twitter profile columns
    id bigint,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    followers_updated_at timestamp with time zone,
    following_updated_at timestamp with time zone,
    muting_updated_at timestamp with time zone,
    blocking_updated_at timestamp with time zone,
    lists_owned_updated_at timestamp with time zone,
    username text,
    name text,
    user_created_at timestamp with time zone,
    description text,
    entities jsonb,
    location text,
    pinned_tweet_id bigint,
    profile_image_url text,
    protected boolean,
    followers_count integer,
    following_count integer,
    tweet_count integer,
    listed_count integer,
    url text,
    verified boolean,
    withheld jsonb,
  ) as $$
begin
return query

  select twitter_profile.* from twitter_profile

  where
    ((follower_of is null) or
      twitter_profile.id in (select source_id from twitter_follow group by source_id
        having array_agg(target_id) @> array(
          select twitter_profile.id from twitter_profile where twitter_profile.username = any(follower_of)
        )))
    and
    ((followed_by is null) or
      twitter_profile.id in (select target_id from twitter_follow group by target_id
        having array_agg(source_id) @> array(
          select twitter_profile.id from twitter_profile where twitter_profile.username = any(followed_by)
        )))
    and
    ((muted_by is null) or
      twitter_profile.id in (select target_id from twitter_mute group by target_id
        having array_agg(source_id) @> array(
          select twitter_profile.id from twitter_profile where twitter_profile.username = any(muted_by)
        )))
    and
    ((blocked_by is null) or
      twitter_profile.id in (select target_id from twitter_block group by target_id
        having array_agg(source_id) @> array(
          select twitter_profile.id from twitter_profile where twitter_profile.username = any(blocked_by)
        )));

end
$$ language plpgsql;

-- Helper function to get relevant user details at once

create function get_user_details(id uuid default null)
  returns table(
    id uuid,
    email text,
    twitter_id bigint,
    twitter_oauth_token jsonb,
    twitter_username text,
    twitter_name text,
    twitter_profile_image_url text
  )
  as $$

select user_profiles.id, user_profiles.email, user_profiles.twitter_id, user_profiles.twitter_oauth_token, twitter_profiles.username as twitter_username, twitter_profiles.name as twitter_name, twitter_profiles.profile_image_url as twitter_profile_image_url
  from user_profiles 
    left join twitter_profiles on user_profiles.twitter_id = twitter_profiles.id
  where (get_user_details.id is null or user_profiles.id = get_user_details.id)
;

$$ language sql;


-- Enable realtime publications for select tables

alter publication supabase_realtime add table
  twitter_api_rate_limit,
  lookup_relation_job,
  manage_list_members_job,
  manage_relation_job,
  user_profile
;
