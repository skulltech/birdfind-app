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

create policy "Authenticated users can view all Twitter follows."
    on twitter_follow for select
    to authenticated
    using (true);

create policy "Users can insert their own Twitter follows."
    on twitter_follow for insert
    to authenticated
    with check (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_follow.source_id
    ));

create policy "Users can update their own Twitter follows."
    on twitter_follow for update
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_follow.source_id
    ));

create policy "Users can delete their own Twitter follows."
    on twitter_follow for delete
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_follow.source_id
    ));

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

create policy "Users can view their own Twitter blocks."
    on twitter_block for select
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_block.source_id
    ));

create policy "Users can insert their own Twitter blocks."
    on twitter_block for insert
    to authenticated
    with check (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_block.source_id
    ));

create policy "Users can update their own Twitter blocks."
    on twitter_block for update
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_block.source_id
    ));

create policy "Users can delete their own Twitter blocks."
    on twitter_block for delete
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

create policy "Users can view their own Twitter mutes."
    on twitter_mute for select
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_mute.source_id
    ));

create policy "Users can insert their own Twitter mutes."
    on twitter_mute for insert
    to authenticated
    with check (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_mute.source_id
    ));

create policy "Users can update their own Twitter mutes."
    on twitter_mute for update
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_mute.source_id
    ));

create policy "Users can delete their own Twitter mutes."
    on twitter_mute for delete
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_mute.source_id
    ));
