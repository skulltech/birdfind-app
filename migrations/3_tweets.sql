create table twitter_tweet (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- All tweet.fields available, in order as in Twitter docs
    text text not null,
    source text not null,
    truncated boolean not null,
    in_reply_to_status_id bigint,
    in_reply_to_user_id bigint,
    in_reply_to_screen_name text,
    user_id bigint not null references twitter_user(id),
    geo jsonb,
    coordinates jsonb,
    place jsonb,
    contributors jsonb,
    retweeted_status_id bigint,
    retweet_count integer not null,
    favorite_count integer not null,
    entities jsonb,
    extended_entities jsonb,
    favorited boolean not null,
    retweeted boolean not null,
    possibly_sensitive boolean not null,
    lang text not null,
    filter_level text not null,
    withheld jsonb
    

    -- Public metrics
    followers_count integer not null,
    following_count integer not null,
    tweet_count integer not null,
    listed_count integer not null,

    url text,
    verified boolean not null,
    withheld jsonb
);
