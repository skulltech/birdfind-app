create table tweets (
    id bigint primary key,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    -- Twitter API fields
    text text not null,
    author_id bigint not null references twitter_profile,
    context_annotations jsonb,
    tweet_created_at timestamp with time zone not null,
    retweet_count integer not null,
    reply_count integer not null,
    like_count integer not null,
    quote_count integer not null
);

create trigger on_tweets_updated
  before update on tweets
  for each row execute procedure set_updated_at();

alter table tweets enable row level security;

create table tweets_entities (
    tweet_id bigint references tweets not null,
    entity_id bigint references entities not null,
    primary key (tweet_id, entity_id)
);

alter table tweets_entities enable row level security;
