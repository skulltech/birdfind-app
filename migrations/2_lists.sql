-- Twitter lists and list membership

create table twitter_list (
  id bigint primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  list_created_at timestamp with time zone not null,
  owner_id bigint references twitter_profile not null,
  name text not null,
  description text not null,
  followers_count integer not null,
  members_count integer not null,
  private boolean not null,

  -- For internal delete logic
  to_delete boolean not null default false
);

create trigger on_twitter_list_updated
  before update on twitter_list
  for each row execute procedure set_updated_at();

alter table twitter_list enable row level security;

create policy "Users can view their own Twitter lists."
    on twitter_list for select
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

create policy "Users can insert their own Twitter lists."
    on twitter_list for insert
    to authenticated
    with check (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

create policy "Users can update their own Twitter lists."
    on twitter_list for update
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

create policy "Users can delete their own Twitter lists."
    on twitter_list for delete
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
      where user_profile.twitter_id = twitter_list.owner_id
    ));

create table twitter_list_member (
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    
    list_id bigint references twitter_list not null,
    member_id bigint references twitter_profile not null,

    -- For internal delete logic
    to_delete boolean not null default false,

    primary key (list_id, member_id)
);

create trigger on_twitter_list_member_updated
  before update on twitter_list_member
  for each row execute procedure set_updated_at();

alter table twitter_list_member enable row level security;

create policy "Users can view members of all public Twitter lists their own private Twitter lists."
    on twitter_list_member for select
    to authenticated
    using (
      true in (
        select private from twitter_list
        where twitter_list.id = twitter_list_member.list_id
      ) or
      auth.uid() in (
      select user_profile.id from user_profile
        inner join twitter_list on user_profile.twitter_id = twitter_list.owner_id
      where twitter_list.id = twitter_list_member.list_id 
    ));

create policy "Users can insert members to their own Twitter lists."
    on twitter_list_member for insert
    to authenticated
    with check (
      auth.uid() in (
      select user_profile.id from user_profile
        inner join twitter_list on user_profile.twitter_id = twitter_list.owner_id
      where twitter_list.id = twitter_list_member.list_id 
    ));

create policy "Users can update members of their own Twitter lists."
    on twitter_list_member for update
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
        inner join twitter_list on user_profile.twitter_id = twitter_list.owner_id
      where twitter_list.id = twitter_list_member.list_id 
    ));

create policy "Users can delete members from their own Twitter lists."
    on twitter_list_member for delete
    to authenticated
    using (
      auth.uid() in (
      select user_profile.id from user_profile
        inner join twitter_list on user_profile.twitter_id = twitter_list.owner_id
      where twitter_list.id = twitter_list_member.list_id 
    ));
