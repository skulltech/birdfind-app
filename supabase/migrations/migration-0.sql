-- User// customer data

create table if not exists user_profile (
    id uuid references auth.users not null primary key,
    email text not null unique,
    
    twitter_oauth_state jsonb,
    twitter_oauth_token jsonb,

    twitter_id bigint unique
);

alter table user_profile enable row level security;

create policy "Profiles are viewable by users who created them."
  on user_profile for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on user_profile for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on user_profile for update
  using ( auth.uid() = id );


-- Storing and searching Twitter users and follow network

create table if not exists twitter_profile (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    followers_updated_at timestamp with time zone default 'epoch' not null,
    following_updated_at timestamp with time zone default 'epoch' not null,
    muting_updated_at timestamp with time zone default 'epoch' not null,
    blocking_updated_at timestamp with time zone default 'epoch' not null,

    -- All user.fields available, in order as in Twitter docs
    username text not null,
    name text not null,
    user_created_at timestamp with time zone not null,
    description text not null,
    entities jsonb,
    location text,
    pinned_tweet_id bigint,
    profile_image_url text not null,
    protected boolean not null,

    -- Public metrics
    followers_count integer not null,
    following_count integer not null,
    tweet_count integer not null,
    listed_count integer not null,

    url text,
    verified boolean not null,
    withheld jsonb
);

alter table twitter_profile enable row level security;

create policy "Twitter profiles are viewable by authenticated users."
    on twitter_profile for select
    to authenticated
    using (true);

create table if not exists twitter_follow (
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    source_id bigint not null,
    target_id bigint not null,

    primary key (source_id, target_id)
);

alter table twitter_follow enable row level security;

create policy "Twitter follows are viewable by authenticated users."
    on twitter_follow for select
    to authenticated
    using (true);

create table if not exists twitter_block (
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    source_id bigint not null,
    target_id bigint not null,

    primary key (source_id, target_id)
);

alter table twitter_block enable row level security;

create policy "Twitter blocks are viewable by only source users."
    on twitter_block for select
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_block.source_id
    ));


create table if not exists twitter_mute (
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    source_id bigint not null,
    target_id bigint not null,

    primary key (source_id, target_id)
);

alter table twitter_mute enable row level security;

create policy "Twitter blocks are viewable by only source users."
    on twitter_mute for select
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_mute.source_id
    ));

create or replace function search_twitter_profiles
    (follower_of text[] default null, followed_by text[] default null, muted_by text[] default null, blocked_by text[] default null)
    returns setof twitter_profile as $$
begin
return query select * from twitter_profile where
    ((follower_of is null) or
      id in (select source_id from twitter_follow group by source_id
        having array_agg(target_id) @> array(
          select id from twitter_profile where username = any(follower_of)
        )))
    and
    ((followed_by is null) or
      id in (select target_id from twitter_follow group by target_id
        having array_agg(source_id) @> array(
          select id from twitter_profile where username = any(followed_by)
        )))
    and
    ((muted_by is null) or
      id in (select target_id from twitter_mute group by target_id
        having array_agg(source_id) @> array(
          select id from twitter_profile where username = any(muted_by)
        )))
    and
    ((blocked_by is null) or
      id in (select target_id from twitter_block group by target_id
        having array_agg(source_id) @> array(
          select id from twitter_profile where username = any(blocked_by)
        )));
end
$$ language plpgsql;

-- inserts a row into public.users
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into user_profile (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


create view user_details as
  select user_profile.id, user_profile.email, user_profile.twitter_id, user_profile.twitter_oauth_token, twitter_profile.username as twitter_username, twitter_profile.profile_image_url as twitter_profile_image_url
  from user_profile 
  left join twitter_profile on user_profile.twitter_id = twitter_profile.id;

alter view user_details owner to authenticated;
