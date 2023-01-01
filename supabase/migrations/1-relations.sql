-- Relationships between users, i.e. follow, block and mute

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
