-- Twitter profile and user// customer profile

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

-- User// customer profile

create table if not exists user_profile (
    id uuid references auth.users not null primary key,
    email text not null unique,
    
    twitter_oauth_state jsonb,
    twitter_oauth_token jsonb,

    twitter_id bigint references twitter_profile
);

alter table user_profile enable row level security;

create policy "Users can view their own profiles."
  on user_profile for select
  to authenticated
  using ( auth.uid() = id );

create policy "Users can update their own profiles."
  on user_profile for update
  to authenticated
  using ( auth.uid() = id );


-- Inserts a row into user_profile everytime an user registers

create function handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

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
