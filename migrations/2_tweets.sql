drop table if exists tweet cascade;
create table tweet (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- Twitter API fields
    text text not null,
    author_id bigint not null references twitter_profile,
    tweet_created_at timestamp with time zone not null,
    retweet_count integer not null,
    reply_count integer not null,
    like_count integer not null,
    quote_count integer not null
);

create trigger on_tweet_updated
  before update on tweet
  for each row execute procedure set_updated_at();

alter table tweet enable row level security;

create policy "Authenticated users can view all tweets."
    on tweet for select
    to authenticated
    using (true);

drop table if exists tweet_entity cascade;
create table tweet_entity (
    tweet_id bigint references tweet not null,
    entity_id bigint references entity not null,
    primary key (tweet_id, entity_id)
);

alter table tweet_entity enable row level security;

create policy "Authenticated users can view all tweet entity mappings."
    on tweet_entity for select
    to authenticated
    using (true);
