create table if not exists twitter_user (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    followers_updated_at timestamp with time zone default 'epoch' not null,
    following_updated_at timestamp with time zone default 'epoch' not null,

    username text not null,
    name text not null,
    followers_count integer not null,
    following_count integer not null,
    tweet_count integer not null,
    description text not null,
    user_created_at timestamp with time zone not null,
    profile_image_url text not null
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

create or replace function search_follow_network
    (follower_of bigint[], followed_by bigint[])
    returns setof twitter_user as $$
begin
    if array_length(follower_of, 1) > 0 and array_length(followed_by, 1) > 0 then
        return query
          select * from twitter_user where id in (
            select follower_id from twitter_follow group by follower_id
                having array_agg(following_id) @> follower_of
            intersect
            select following_id from twitter_follow group by following_id
                having array_agg(follower_id) @> followed_by
          );
    elseif array_length(follower_of, 1) > 0 then
        return query
          select * from twitter_user where id in (
            select follower_id from twitter_follow group by follower_id
                having array_agg(following_id) @> follower_of
          );
    elseif array_length(followed_by, 1) > 0 then
        return query
          select * from twitter_user where id in (
            select following_id from twitter_follow group by following_id
                having array_agg(follower_id) @> followed_by
          );
    end if;
end
$$ language plpgsql;
