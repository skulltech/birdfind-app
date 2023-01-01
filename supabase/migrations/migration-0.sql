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


-- Inserts a row into user_profile
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

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


create table if not exists user_event (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default now() not null,

    user_id uuid references auth.users not null,

    type text not null check (type in 
      ('search', 'lookup-relation', 'perform-action', 'prompt-to-filters')),
    data jsonb
);

alter table user_event enable row level security;

create policy "Users can insert events for themselves."
  on user_event for insert
  with check ( auth.uid() = user_id );


-- Storing and searching Twitter users and follow network

create table if not exists twitter_profile (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- Internal timestamps
    followers_updated_at timestamp with time zone default 'epoch' not null,
    following_updated_at timestamp with time zone default 'epoch' not null,
    muting_updated_at timestamp with time zone default 'epoch' not null,
    blocking_updated_at timestamp with time zone default 'epoch' not null,
    lists_owned_updated_at timestamp with time zone default 'epoch' not null,

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

create policy "Users can update their own Twitter profiles."
    on twitter_profile for update
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_profile.id
    ));

create table if not exists twitter_follow (
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    source_id bigint not null,
    target_id bigint not null,

    -- For internal delete logic
    to_delete boolean not null default false,

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

    -- For internal delete logic
    to_delete boolean not null default false,

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

    -- For internal delete logic
    to_delete boolean not null default false,

    primary key (source_id, target_id)
);

alter table twitter_mute enable row level security;

create policy "Twitter mutes are viewable by only source users."
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


-- Update relation jobs
create table if not exists lookup_relation_job (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,

    -- Actual inputs
    user_id uuid references auth.users not null,
    target_twitter_id bigint references twitter_profile not null,
    relation text not null check (relation in ('followers', 'following', 'blocking', 'muting')),
    priority integer not null,

    -- To track progress
    paused boolean default false not null,
    finished boolean default false not null,
    deleted boolean default false not null,
    pagination_token text,
    updated_count integer default 0 not null
);

alter table lookup_relation_job enable row level security;

create policy "Users can create lookup-relation jobs that will use their own tokens"
  on lookup_relation_job for insert
  with check ( auth.uid() = user_id );

create policy "lookup-relation Jobs are viewable by users who created them"
  on lookup_relation_job for select
  using ( auth.uid() = user_id );

create policy "Users can update lookup-relation jobs they created"
  on lookup_relation_job for update
  using ( auth.uid() = user_id );


create table if not exists twitter_api_rate_limit (
  user_twitter_id bigint references twitter_profile not null,
  endpoint text not null check (endpoint in ('get-followers', 'get-following', 'get-blocking', 'get-muting', 'add-list-member')),
  created_at timestamp with time zone default now() not null,
  resets_at timestamp with time zone not null,

  primary key (user_twitter_id, endpoint)
);

alter table twitter_api_rate_limit enable row level security;

-- Function to get the next lookup-relation jobs to execute

create or replace function get_lookup_relation_jobs_to_add(active_jobs bigint[], failed_jobs bigint[])
  returns setof lookup_relation_job as $$

select
  distinct on (lookup_relation_job.user_id, lookup_relation_job.relation)
  lookup_relation_job.*
from lookup_relation_job
  left join user_profile on user_profile.id = lookup_relation_job.user_id
  left join twitter_api_rate_limit on 
    twitter_api_rate_limit.user_twitter_id = user_profile.twitter_id and
    case
      when lookup_relation_job.relation = 'followers' then twitter_api_rate_limit.endpoint = 'get-followers'
      when lookup_relation_job.relation = 'following' then twitter_api_rate_limit.endpoint = 'get-following'
      when lookup_relation_job.relation = 'blocking' then twitter_api_rate_limit.endpoint = 'get-blocking'
      when lookup_relation_job.relation = 'muting' then twitter_api_rate_limit.endpoint = 'get-muting'
      else false
    end
where lookup_relation_job.finished = false
  and lookup_relation_job.paused = false
  and lookup_relation_job.deleted = false
  and not (lookup_relation_job.id = any(failed_jobs))
  and (twitter_api_rate_limit.resets_at is null or twitter_api_rate_limit.resets_at < now())
  and lookup_relation_job.user_id not in (
    select user_id from lookup_relation_job where id = any(active_jobs)
  )
order by lookup_relation_job.user_id, lookup_relation_job.relation, lookup_relation_job.priority desc
;

$$ language sql;


-- Function to get relevant user details at once

create or replace function get_user_details(id uuid default null)
  returns table(
    id uuid,
    email text,
    twitter_id bigint,
    twitter_oauth_token jsonb,
    twitter_username text,
    twitter_profile_image_url text
  )
  as $$

select user_profile.id, user_profile.email, user_profile.twitter_id, user_profile.twitter_oauth_token, twitter_profile.username as twitter_username, twitter_profile.profile_image_url as twitter_profile_image_url
  from user_profile 
    left join twitter_profile on user_profile.twitter_id = twitter_profile.id
  where (get_user_details.id is null or user_profile.id = get_user_details.id)
;

$$ language sql;

-- Twitter lists

create table if not exists twitter_list (
  id bigint primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  list_created_at timestamp with time zone not null,
  owner_id bigint references twitter_profile not null,
  name text not null,
  description text not null,
  followers_count integer not null,
  members_count integer not null,
  private boolean not null,

  -- For internal delete logic
  to_delete boolean not null default false
);

alter table twitter_list enable row level security;

create policy "Twitter lists are viewable by owner."
    on twitter_list for select
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

create policy "Twitter lists can be created by owner."
    on twitter_list for insert
    to authenticated
    with check (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

create policy "Twitter lists can be updated by owner."
    on twitter_list for update
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

create policy "Twitter lists can be deleted by owner."
    on twitter_list for delete
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

-- Add list members jobs

create table if not exists add_list_members_job (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,

    -- Actual inputs
    user_id uuid references auth.users not null,
    member_ids bigint[] not null,
    list_id bigint references twitter_list not null,
    priority integer not null,

    -- To track progress
    paused boolean default false not null,
    finished boolean generated always as (member_ids_added @> member_ids) stored,
    deleted boolean default false not null,
    member_ids_added bigint[] default array[]::bigint[]
);

-- Virtual columns

create function member_ids_text(add_list_members_job) returns text[] as $$
  select $1.member_ids::text[];
$$ language sql;

create function member_ids_added_text(add_list_members_job) returns text[] as $$
  select $1.member_ids_added::text[];
$$ language sql;


alter table add_list_members_job enable row level security;

create policy "Users can create add-list-members jobs that will use their own tokens"
  on add_list_members_job for insert
  with check ( auth.uid() = user_id );

create policy "add-list-members Jobs are viewable by users who created them"
  on add_list_members_job for select
  using ( auth.uid() = user_id );

create policy "Users can update add-list-members jobs they created"
  on add_list_members_job for update
  using ( auth.uid() = user_id );


-- Function to get the next add-list-members jobs to execute

create or replace function get_add_list_members_jobs_to_add(active_jobs bigint[], failed_jobs bigint[])
  returns setof add_list_members_job as $$

select
  distinct on (add_list_members_job.user_id)
  add_list_members_job.*
from add_list_members_job
  left join user_profile on user_profile.id = add_list_members_job.user_id
  left join twitter_api_rate_limit on 
    twitter_api_rate_limit.user_twitter_id = user_profile.twitter_id and
    twitter_api_rate_limit.endpoint = 'add-list-member'
where add_list_members_job.finished = false
  and add_list_members_job.paused = false
  and add_list_members_job.deleted = false
  and (twitter_api_rate_limit.resets_at is null or twitter_api_rate_limit.resets_at < now())
  and not (add_list_members_job.id = any(failed_jobs))
  and add_list_members_job.user_id not in (
    select user_id from add_list_members_job where id = any(active_jobs)
  )
order by add_list_members_job.user_id, add_list_members_job.priority desc
;

$$ language sql;


-- Manage relation jobs

create table if not exists manage_relation_job (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,

    -- Actual inputs
    user_id uuid references auth.users not null,
    target_ids bigint[] not null,
    relation text check in ('follow', 'mute', 'block'),
    add boolean not null,
    priority integer not null,

    -- To track progress
    paused boolean default false not null,
    finished boolean generated always as (target_ids_done @> target_ids) stored,
    deleted boolean default false not null,
    target_ids_done bigint[] default array[]::bigint[]
);

-- Virtual columns

create function target_ids_text(perform_action_job) returns text[] as $$
  select $1.target_ids::text[];
$$ language sql;

create function target_ids_done_text(perform_action_job) returns text[] as $$
  select $1.target_ids_done::text[];
$$ language sql;
