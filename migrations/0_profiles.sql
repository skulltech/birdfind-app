-- Helper function for setting updated_at to current timestamp

drop function if exists set_updated_at cascade;
create function set_updated_at()
  returns trigger as $$
begin
  new.updated_at = now();
  return new;
end
$$ language plpgsql;


-- Twitter profile and user// customer profile

drop table if exists twitter_profile cascade;
create table twitter_profile (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- Twitter API fields
    username text not null,
    name text not null,
    user_created_at timestamp with time zone not null,
    description text not null,
    location text,
    profile_image_url text not null,
    protected boolean not null,
    followers_count integer not null,
    following_count integer not null,
    tweet_count integer not null,
    listed_count integer not null,
    verified boolean not null,

    -- Profile embedding
    latest_tweet_id bigint references tweet,
    embedding vector(1536),
    embedding_updated_at timestamp with time zone default timestamp 'epoch' not null
);

create trigger on_twitter_profile_updated
  before update on twitter_profile
  for each row execute procedure set_updated_at();


-- User// customer profile

drop table if exists user_profile cascade;
create table user_profile (
    id uuid references auth.users not null primary key,
    updated_at timestamp with time zone default now() not null,
    email text not null unique,
    
    twitter_oauth_state jsonb,
    twitter_oauth_token jsonb,

    twitter_id bigint references twitter_profile unique
);

create trigger on_user_profile_updated
  before update on user_profile
  for each row execute procedure set_updated_at();

alter table user_profile enable row level security;

alter publication supabase_realtime add table user_profile;

create policy "Users can view their own profiles."
  on user_profile for select
  to authenticated
  using ( auth.uid() = id );

create policy "Users can update their own profiles."
  on user_profile for update
  to authenticated
  using ( auth.uid() = id );


-- Inserts a row into user_profile everytime an user registers

drop function if exists create_user_profile cascade;
create function create_user_profile()
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

drop trigger if exists on_auth_users_created on auth.users cascade;
create trigger on_auth_users_created
  after insert on auth.users
  for each row execute procedure create_user_profile();

-- Policies for twitter_profile

alter table twitter_profile enable row level security;

create policy "Authenticated users can view all Twitter profiles."
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

-- Helper function to get relevant user details at once

drop function if exists get_user_details cascade;
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

select user_profile.id, user_profile.email, user_profile.twitter_id, user_profile.twitter_oauth_token, twitter_profile.username as twitter_username, twitter_profile.name as twitter_name, twitter_profile.profile_image_url as twitter_profile_image_url
  from user_profile 
    left join twitter_profile on user_profile.twitter_id = twitter_profile.id
  where (get_user_details.id is null or user_profile.id = get_user_details.id)
;

$$ language sql;
