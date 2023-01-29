drop table if exists entity cascade;
create table entity (
    id bigint primary key not null,
    name text not null,
    description text
);

drop table if exists domain cascade;
create table domain (
    id smallint primary key not null,
    name text not null,
    description text
);

drop table if exists domain_entity cascade;
create table domain_entity (
    domain_id smallint references domain not null,
    entity_id bigint references entity not null,
    primary key (domain_id, entity_id)
);

alter table entity enable row level security;
alter table domain enable row level security;
alter table domain_entity enable row level security;

create policy "Authenticated users can view all domains."
    on domain for select
    to authenticated
    using (true);

create policy "Authenticated users can view all entities."
    on entity for select
    to authenticated
    using (true);

create policy "Authenticated users can view all domain entity mappings."
    on domain_entity for select
    to authenticated
    using (true);

-- Get all domains which have at least one entity, order by associated entity count
drop function if exists get_domains cascade;
create function get_domains ()
    returns setof domain as $$

select domain.*
  from domain
  left join domain_entity on domain_entity.domain_id = domain.id
where domain_entity.entity_id is not null
group by domain.id
order by count(domain_entity.entity_id) desc
;

$$ language sql;

-- Get all entities in a domain, sorted by associated tweet count
drop function if exists get_entities cascade;
create function get_entities (search text default '', domain_id bigint default null)
    returns setof entity as $$

select entity.*
  from entity
  left join tweet_entity on tweet_entity.entity_id = entity.id
where entity.name ~* search and (
  get_entities.domain_id is null or (
    entity.id in (
      select domain_entity.entity_id from domain_entity where domain_entity.domain_id = get_entities.domain_id
)))
group by entity.id
order by count(tweet_entity.tweet_id) desc
;

$$ language sql;

insert into domain values
    (3, 'TV Shows'),
    (4, 'TV Episodes'),
    (6, 'Sports Events'),
    (10, 'Person'),
    (11, 'Sport'),
    (12, 'Sports Team'),
    (13, 'Place'),
    (22, 'TV Genres'),
    (23, 'TV Channels'),
    (26, 'Sports League'),
    (27, 'American Football Game'),
    (28, 'NFL Football Game'),
    (29, 'Events'),
    (31, 'Community'),
    (35, 'Politicians'),
    (38, 'Political Race'),
    (39, 'Basketball Game'),
    (40, 'Sports Series'),
    (43, 'Socccer Match'),
    (44, 'Baseball Game'),
    (45, 'Brand Vertical'),
    (46, 'Brand Category'),
    (47, 'Brand'),
    (48, 'Product'),
    (54, 'Musician'),
    (55, 'Music Genre'),
    (56, 'Actor'),
    (58, 'Entertainment Personality'),
    (60, 'Athlete'),
    (65, 'Interests and Hobbies Vertical'),
    (66, 'Interests and Hobbies Category'),
    (67, 'Interests and Hobbies'),
    (68, 'Hockey Game'),
    (71, 'Video Game'),
    (78, 'Video Game Publisher'),
    (79, 'Video Game Hardware'),
    (83, 'Cricket Match'),
    (84, 'Book'),
    (85, 'Book Genre'),
    (86, 'Movie'),
    (87, 'Movie Genre'),
    (88, 'Political Body'),
    (89, 'Music Album'),
    (90, 'Radio Station'),
    (91, 'Podcast'),
    (92, 'Sports Personality'),
    (93, 'Coach'),
    (94, 'Journalist'),
    (95, 'TV Channel [Entity Service]'),
    (109, 'Reocurring Trends'),
    (110, 'Viral Accounts'),
    (114, 'Concert'),
    (115, 'Video Game Conference'),
    (116, 'Video Game Tournament'),
    (117, 'Movie Festival'),
    (118, 'Award Show'),
    (119, 'Holiday'),
    (120, 'Digital Creator'),
    (122, 'Fictional Character'),
    (130, 'Multimedia Franchise'),
    (131, 'Unified Twitter Taxonomy'),
    (136, 'Video Game Personality'),
    (137, 'eSports Team'),
    (138, 'eSports Player'),
    (139, 'Fan Community'),
    (149, 'Esports League'),
    (152, 'Food'),
    (155, 'Weather'),
    (156, 'Cities'),
    (157, 'Colleges & Universities'),
    (158, 'Points of Interest'),
    (159, 'States'),
    (160, 'Countries'),
    (162, 'Exercise & fitness'),
    (163, 'Travel'),
    (164, 'Fields of study'),
    (165, 'Technology'),
    (166, 'Stocks'),
    (167, 'Animals'),
    (171, 'Local News'),
    (172, 'Global TV Show'),
    (173, 'Google Product Taxonomy'),
    (174, 'Digital Assets & Crypto'),
    (175, 'Emergency Events')
;