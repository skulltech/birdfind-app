create table if not exists twitter_user (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    followers_updated_at timestamp with time zone default now() not null,
    following_updated_at timestamp with time zone default now() not null,

    username text not null,
    name text not null,
    followers_count integer not null,
    following_count integer not null,
    tweet_count integer not null,
    description text not null,
    user_created_at timestamp with time zone not null
);

create table if not exists twitter_follow (
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    follower_id bigint not null,
    following_id bigint not null,

    primary key (follower_id, following_id)
);

alter table twitter_user enable row level security;
alter table twitter_follow enable row level security;
