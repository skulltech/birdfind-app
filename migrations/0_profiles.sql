-- Helper function for setting updated_at to current timestamp

create function set_updated_at()
  returns trigger as $$
begin
  new.updated_at = now();
  return new;
end
$$ language plpgsql;


-- Twitter profile and user// customer profile

create table twitter_profiles (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- Internal timestamps
    followers_updated_at timestamp with time zone default 'epoch' not null,
    following_updated_at timestamp with time zone default 'epoch' not null,

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
    embedding double precision[]
);

create trigger on_twitter_profiles_updated
  before update on twitter_profiles
  for each row execute procedure set_updated_at();


-- User// customer profile

create table user_profiles (
    id uuid references auth.users not null primary key,
    updated_at timestamp with time zone default now() not null,
    email text not null unique,
    
    twitter_oauth_state jsonb,
    twitter_oauth_token jsonb,

    twitter_id bigint references twitter_profiles unique
);

create trigger on_user_profiles_updated
  before update on user_profiles
  for each row execute procedure set_updated_at();

alter table user_profiles enable row level security;

create policy "Users can view their own profiles."
  on user_profiles for select
  to authenticated
  using ( auth.uid() = id );

create policy "Users can update their own profiles."
  on user_profiles for update
  to authenticated
  using ( auth.uid() = id );


-- Inserts a row into user_profiles everytime an user registers

create function create_user_profile()
    returns trigger
    language plpgsql
    security definer set search_path = public
as $$
begin
  insert into user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_users_created
  after insert on auth.users
  for each row execute procedure create_user_profile();

-- Policies for twitter_profiles

alter table twitter_profiles enable row level security;

create policy "Authenticated users can view all Twitter profiles."
    on twitter_profiles for select
    to authenticated
    using (true);

create policy "Users can update their own Twitter profiles."
    on twitter_profiles for update
    to authenticated
    using (
      auth.uid() in (
      select user_profiles.id from user_profiles
      where user_profiles.twitter_id = twitter_profiles.id
    ));
