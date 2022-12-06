-- User// customer data

create table if not exists user_profile (
    id uuid references auth.users not null primary key,
    
    twitter_oauth_state jsonb,
    twitter_oauth_token jsonb,

    twitter_id bigint
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

create policy "Users can insert their own twitter profile."
    on twitter_profile for insert
    with check (
        auth.uid() in (
            select user_profile.id from user_profile
            where user_profile.twitter_id = twitter_profile.id
        )
    );

create policy "Users can update own twitter profile."
  on twitter_profile for update
  using (
        auth.uid() in (
            select user_profile.id from user_profile
            where user_profile.twitter_id = twitter_profile.id
        )
    );

create table if not exists twitter_follow (
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    follower_id bigint not null,
    following_id bigint not null,

    primary key (follower_id, following_id)
);

alter table twitter_follow enable row level security;

create or replace function search_follow_network
    (follower_of bigint[], followed_by bigint[])
    returns setof twitter_profile as $$
begin
    if array_length(follower_of, 1) > 0 and array_length(followed_by, 1) > 0 then
        return query
          select * from twitter_profile where id in (
            select follower_id from twitter_follow group by follower_id
                having array_agg(following_id) @> follower_of
            intersect
            select following_id from twitter_follow group by following_id
                having array_agg(follower_id) @> followed_by
          );
    elseif array_length(follower_of, 1) > 0 then
        return query
          select * from twitter_profile where id in (
            select follower_id from twitter_follow group by follower_id
                having array_agg(following_id) @> follower_of
          );
    elseif array_length(followed_by, 1) > 0 then
        return query
          select * from twitter_profile where id in (
            select following_id from twitter_follow group by following_id
                having array_agg(follower_id) @> followed_by
          );
    end if;
end
$$ language plpgsql;


-- inserts a row into public.users
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into user_profile (id)
  values (new.id);
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
