
drop table if exists profiles cascade;
drop table if exists threads cascade;
drop table if exists games cascade;
drop table if exists characters cascade;
drop table if exists posts cascade;
drop table if exists reactions cascade;
drop table if exists messages cascade;
drop table if exists boards cascade;
drop table if exists bookmarks cascade;
drop table if exists user_reads cascade;
drop table if exists maps cascade;

drop type if exists character_state;
drop type if exists game_system;
drop type if exists game_category;
drop type if exists work_type cascade;
drop type if exists work_tag cascade;
drop type if exists work_category cascade;

drop view if exists posts_owner;
drop view if exists board_list;
drop view if exists game_list;
drop view if exists work_list;
drop view if exists last_posts;


-- ENUMS --------------------------------------------


create type character_state as enum ('alive', 'unconscious', 'dead');
create type game_system as enum ('base', 'vampire5', 'yearzero', 'dnd5', 'drd1', 'cyberpunk', 'starwars', 'cthulhu', 'warhammer', 'shadowrun', 'pathfinder', 'mutant', 'gurps', 'fate', 'savage', 'dungeonworld', 'other');
create type game_category as enum ('anime', 'cyberpunk', 'detective', 'based', 'fantasy', 'furry', 'history', 'horror', 'comedy', 'scifi', 'steampunk', 'strategy', 'survival', 'urban', 'relationship', 'other');
create type work_type as enum ('text', 'image', 'audio');
create type work_tag as enum ('story', 'continued', 'preview', 'thought', 'fanfiction', 'scifi', 'fantasy', 'mythology', 'horror', 'detective', 'romance', 'fairytale', 'dystopia', 'humorous', 'fromlife', 'motivational', 'erotica', 'biography', 'gameworld', 'gamematerial', 'editorial', 'announcement', 'project');
create type work_category as enum ('prose', 'poetry', 'game', 'other');


-- TABLES --------------------------------------------


create table profiles (
  id uuid not null primary key,
  name text unique not null,
  portrait text,
  created_at timestamp with time zone default current_timestamp,
  last_activity timestamp with time zone,
  old_id int4 null,
  autorefresh boolean default false,
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

create table threads (
  id int4 not null primary key generated by default as identity,
  name text null,
  created_at timestamp with time zone default current_timestamp
);

create table games (
  id int4 not null primary key generated by default as identity,
  name text unique not null,
  owner uuid not null default auth.uid(),
  annotation text null default 'Popis světa, úvod do příběhu apod. (Z tohoto textu také vychází AI asistent pro přípravu *podkladů pro vypravěče* níže.)'::text,
  info text null default 'Informace pro hráče o pravidlech, světě, postavách, příběhu apod.'::text,
  recruitment text null default 'Informace o náboru nových hráčů, četnosti hraní a tvorbě postav.'::text,
  prompt text null default 'Z tohoto textu vychází AI vypravěč pro tvorbu příběhu.'::text,
  notes text null default 'Poznámky a zápisky ke hře, záznamy o hraní, plány apod.'::text,
  system public.game_system not null default 'base'::game_system,
  category public.game_category not null default 'other'::game_category,
  discussion_thread int4 null,
  recruitment_open boolean not null default true,
  open_codex boolean not null default true,
  open_game boolean not null default true,
  open_discussion boolean not null default false,
  game_thread int4 null,
  openai_thread text null,
  openai_storyteller text null,
  custom_header text null,
  active_map integer null,
  welcome_message text null default 'Vítej v naší hře!'::text,
  context_dice boolean not null default true,
  archived boolean default false,
  created_at timestamp with time zone default current_timestamp,
  info_changed_at timestamp with time zone default current_timestamp,
  characters_changed_at timestamp with time zone default current_timestamp,
  constraint games_owner_fkey foreign key (owner) references profiles(id) on delete restrict,
  constraint games_discussion_thread_fkey foreign key (discussion_thread) references threads(id),
  constraint games_game_thread_fkey foreign key (game_thread) references threads (id)
);

create table codex_sections (
  id int4 not null primary key generated by default as identity,
  game int4 not null,
  name text not null,
  slug text not null,
  hidden boolean not null default false,
  index smallint null default 0,
  content text,
  created_at timestamp with time zone default current_timestamp,
  constraint codex_game_fkey foreign key (game) references games (id) on delete cascade
);

create table codex_pages (
  id int4 not null primary key generated by default as identity,
  game int4 not null,
  section int4 not null,
  name text not null,
  slug text not null,
  content text,
  hidden boolean not null default false,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  constraint codex_game_fkey foreign key (game) references games (id) on delete cascade,
  constraint codex_sections_fkey foreign key (section) references codex_sections (id) on delete cascade
);

create table maps (
  id int4 not null primary key generated by default as identity,
  game int4 not null,
  name text not null,
  image text not null,
  description text,
  hidden boolean null,
  fow boolean not null default false,
  fow_image text null,
  characters json not null default '{}',
  propositions json not null default '{}',
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp,
  constraint maps_game_fkey foreign key (game) references games (id) on delete cascade
);

alter table games add constraint games_active_map_fkey foreign key (active_map) references maps (id) on delete set null;

create table boards (
  id int4 not null primary key generated by default as identity,
  name text unique not null,
  header text null default 'Popis tematického zaměření této diskuze, užitečné odkazy, pravidla etc.'::text,
  thread int4 null,
  owner uuid not null default auth.uid(),
  open boolean not null default true,
  mods uuid[] null default '{}'::uuid[],
  bans uuid[] null default '{}'::uuid[],
  members uuid[] null default '{}'::uuid[],
  custom_header text null,
  created_at timestamp with time zone default current_timestamp,
  constraint boards_owner_fkey foreign key (owner) references profiles(id) on delete restrict,
  constraint boards_thread_fkey foreign key (thread) references threads(id)
);

create table characters (
  id uuid not null primary key default gen_random_uuid(),
  game int4,
  player uuid,
  portrait text,
  name text,
  bio text,
  appearance text,
  storyteller_notes text,
  storyteller boolean not null default false,
  open boolean not null default false,
  accepted boolean not null default false,
  state public.character_state not null default 'alive'::character_state,
  constraint characters_game_fkey foreign key (game) references games (id) on delete cascade,
  constraint characters_player_fkey foreign key (player) references profiles (id) on delete cascade
);

create table works (
  id int4 not null primary key generated by default as identity,
  type public.work_type not null default 'text'::work_type,
  owner uuid not null,
  name text not null,
  annotation text not null,
  content text not null,
  thread int4 null,
  custom_header text null,
  category public.work_category not null default 'other'::work_category,
  tags public.work_tag[] null default '{}'::public.work_tag[],
  likes uuid[] null default '{}'::uuid[],
  dislikes uuid[] null default '{}'::uuid[],
  reports uuid[] null default '{}'::uuid[],
  editorial boolean null default false,
  created_at timestamp with time zone default current_timestamp,
  constraint works_owner_fkey foreign key (owner) references profiles (id) on delete set null
);

create table posts (
  id int4 not null primary key generated by default as identity,
  thread int4,
  owner uuid,
  owner_type text not null,
  content text,
  important boolean default false,
  audience uuid[] null,
  openai_post text null,
  moderated boolean default false,
  dice boolean default false,
  created_at timestamp with time zone default current_timestamp,
  constraint posts_thread_fkey foreign key (thread) references threads (id) on delete cascade
);

create table reactions (
  post_id int4 not null,
  thumbs uuid[] null default '{}'::uuid[],
  frowns uuid[] null default '{}'::uuid[],
  shocks uuid[] null default '{}'::uuid[],
  hearts uuid[] null default '{}'::uuid[],
  laughs uuid[] null default '{}'::uuid[],
  constraint public_reactions_post_id_fkey foreign key (post_id) references posts (id) on delete cascade,
  constraint unique_post_id unique (post_id)
);

create table messages (
  id int4 not null primary key generated by default as identity,
  sender_user uuid,
  recipient_user uuid,
  sender_character uuid,
  recipient_character uuid,
  content text,
  read boolean default false,
  moderated boolean default false,
  created_at timestamp with time zone default current_timestamp,
  constraint messages_sender_user_fkey foreign key (sender_user) references profiles (id) on delete cascade,
  constraint messages_recipient_user_fkey foreign key (recipient_user) references profiles (id) on delete cascade,
  constraint messages_sender_character_fkey foreign key (sender_character) references characters (id) on delete cascade,
  constraint messages_recipient_character_fkey foreign key (recipient_character) references characters (id) on delete cascade
);

create table bookmarks (
  id int4 not null primary key generated by default as identity,
  user_id uuid null,
  game_id int4 null,
  board_id int4 null,
  work_id int4 null,
  created_at timestamp with time zone null default current_timestamp,
  constraint unique_user_game unique (user_id, game_id),
  constraint unique_user_board unique (user_id, board_id),
  constraint unique_user_work unique (user_id, work_id),
  constraint bookmarks_work_id_fkey foreign key (work_id) references works (id) on delete cascade,
  constraint bookmarks_game_id_fkey foreign key (game_id) references games (id) on delete cascade,
  constraint bookmarks_board_id_fkey foreign key (board_id) references boards (id) on delete cascade,
  constraint bookmarks_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade
);

create table user_reads (
  user_id uuid not null,
  slug text not null,
  read_at timestamp with time zone not null default current_timestamp,
  foreign key (user_id) references profiles (id) on delete cascade,
  primary key (user_id, slug)
);

create table subscriptions (
  id int4 not null primary key generated by default as identity,
  user_id uuid not null,
  game int4 not null,
  notification boolean default false,
  email boolean default false,
  created_at timestamp with time zone default current_timestamp,
  constraint subscriptions_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade,
  constraint subscriptions_game_id_fkey foreign key (game_id) references games (id) on delete cascade,
  constraint subscriptions_user_game_unique unique (user_id, game)
);

-- VIEWS --------------------------------------------


create or replace view posts_owner as
  select
    p.*,
    case
      when p.owner_type = 'user' then profiles.name
      when p.owner_type = 'character' then characters.name
    end as owner_name,
    case
      when p.owner_type = 'user' then profiles.portrait
      when p.owner_type = 'character' then characters.portrait
    end as owner_portrait,
    get_character_names (p.audience) as audience_names,
    reactions.*
  from
    posts p
    left join profiles on p.owner = profiles.id and p.owner_type = 'user'
    left join characters on p.owner = characters.id and p.owner_type = 'character'
    left join reactions on p.id = reactions.post_id
  order by
    p.created_at desc;

create or replace view board_list as
  select b.*, pr.id as owner_id, pr.name as owner_name, count(p.id) as post_count
  from boards b
    left join threads t on b.thread = t.id
    left join profiles pr on b.owner = pr.id
    left join posts p on t.id = p.thread
  group by b.id, pr.id, pr.name
  order by b.created_at desc;

create or replace view game_list as
  select g.*, pr.id as owner_id, pr.name as owner_name, count(p.id) as post_count, max(p.created_at) as last_post
  from games g
    left join threads t on g.game_thread = t.id
    left join profiles pr on g.owner = pr.id
    left join posts p on t.id = p.thread
  group by g.id, pr.id, pr.name
  order by g.created_at desc;

create or replace view work_list as
  select w.*, pr.id as owner_id, pr.name as owner_name, pr.portrait as owner_portrait, count(p.id) as post_count
  from works w
    left join threads t on w.thread = t.id
    left join profiles pr on w.owner = pr.id
    left join posts p on t.id = p.thread
  group by w.id, pr.id, pr.name
  order by w.created_at desc;

--create or replace view last_posts as
--  select p.id, p.content, p.created_at,
--    case
--      when g.id is not null then 'game'
--      when b.id is not null then 'board'
--      when w.id is not null then 'work'
--    end as content_type,
--    coalesce(g.id::text, b.id::text, w.id::text) as content_id,
--    p.owner,
--    p.owner_type,
--    case
--      when p.owner_type = 'user' then pr.name
--      when p.owner_type = 'character' then ch.name
--    end as owner_name,
--    case
--      when p.owner_type = 'user' then pr.portrait
--      when p.owner_type = 'character' then ch.portrait
--    end as owner_portrait,
--    case
--      when g.id is not null then g.name
--      when b.id is not null then b.name
--      when w.id is not null then w.name
--    end as content_name,
--    p.frowns, p.hearts, p.laughs, p.thumbs, p.shocks
--  from
--    posts p
--    left join games g on p.thread = g.game_thread
--    left join boards b on p.thread = b.thread
--    left join works w on p.thread = w.thread
--    left join profiles pr on p.owner = pr.id and p.owner_type = 'user'
--    left join characters ch on p.owner = ch.id and p.owner_type = 'character'
--  where
--    p.audience is null and (g.id is not null or b.id is not null or w.id is not null) and p.dice = FALSE and p.moderated = FALSE and g.open_game = true
--  order by
--    p.created_at desc
--  limit 10;


-- FUNCTIONS --------------------------------------------


create or replace function add_storyteller () returns trigger as $$
begin
  insert into characters (name, game, player, accepted, storyteller) values ('Vypravěč', new.id, new.owner, true, true);
  return new;
end;
$$ language plpgsql;


create or replace function kick_character (character_id uuid) returns void as $$
declare
  character_row characters%ROWTYPE;
begin
  select * into character_row from characters where id = character_id;
  if is_storyteller(character_row.game) is false then raise exception 'Not a storyteller'; end if;
  -- create a new character with the same data for the player to keep (except for the player and game columns)
  character_row.id := gen_random_uuid();
  character_row.game := null;
  character_row.accepted := false;
  insert into characters values (character_row.*);
  -- update the original character to remove the player and game (to keep their game posts the same)
  update characters set player = null, game = null where id = character_id;
end;
$$ language plpgsql security definer;


create or replace function add_game_threads () returns trigger as $$
begin
  insert into threads (name) values (new.name || ' - discussion') returning id into new.discussion_thread;
  insert into threads (name) values (new.name || ' - game') returning id into new.game_thread;
  return new;
end;
$$ language plpgsql;


create or replace function delete_game_threads () returns trigger as $$
begin
  delete from threads where id = old.discussion_thread;
  delete from threads where id = old.game_thread;
  return old;
end;
$$ language plpgsql;


create or replace function add_thread () returns trigger as $$
begin
  insert into threads (name) values (new.name) returning id into new.thread;
  return new;
end;
$$ language plpgsql;


create or replace function delete_thread () returns trigger as $$
begin
  delete from threads where id = old.thread;
  return old;
end;
$$ language plpgsql;


create or replace function get_character_names (audience_ids uuid[]) returns text[] as $$
declare
  names text[];
begin
  select array_agg(name) into names from unnest(audience_ids) as audience_id join characters on characters.id = audience_id;
  return names;
end;
$$ language plpgsql;


create or replace function get_game_posts (thread_id integer, game_id integer, owners uuid[], _limit integer, _offset integer, _search text DEFAULT NULL)
  returns json as $$
declare
  is_storyteller boolean;
  player_characters uuid[];
  search_lower text;
begin
  -- Normalize the search term to lowercase, handling NULL cases
  search_lower := lower(coalesce(_search, ''));

  -- check if the user is a storyteller in this game
  select exists(select 1 from characters where game = game_id and player = auth.uid() and storyteller) into is_storyteller;

  -- get array of player's character ids
  select array_agg(id) into player_characters from characters where game = game_id and player = auth.uid();

  return (
    with filtered_posts as (
      select p.*,
        -- Check if a search term is provided, if not, use the original content
        case
          when search_lower = '' then p.content
          else replace(lower(p.content), search_lower, '<span class="highlight">' || search_lower || '</span>')
        end as highlighted_content
      from posts_owner p where p.thread = thread_id
      and (
        p.audience is null or is_storyteller or
        (not is_storyteller and (p.audience && player_characters or p.owner = any(player_characters)))
      )
      and (owners is null or p.owner = any(owners))
      and (_search is null or lower(p.content) like '%' || search_lower || '%')
    ), ordered_posts as (
      select to_jsonb(fp) - 'content' || jsonb_build_object('content', fp.highlighted_content) as post
      from filtered_posts fp
      order by created_at desc
      limit _limit offset _offset
    )
    select json_build_object(
      'posts', (select json_agg(op.post) from ordered_posts op),
      'count', (select count(*) from filtered_posts)
    )
  );
end;
$$ language plpgsql;


create or replace function update_reaction (post int4, reaction_type text, action text) returns setof reactions as $$
declare
  user_id uuid := auth.uid();
begin
  if action = 'add' then
    return query
    insert into reactions (post_id, thumbs, frowns, shocks, hearts, laughs)
    values (
      post,
      case when reaction_type = 'thumbs' then array[user_id] else '{}' end,
      case when reaction_type = 'frowns' then array[user_id] else '{}' end,
      case when reaction_type = 'shocks' then array[user_id] else '{}' end,
      case when reaction_type = 'hearts' then array[user_id] else '{}' end,
      case when reaction_type = 'laughs' then array[user_id] else '{}' end
    )
    on conflict (post_id) do update
    set thumbs = case when reaction_type = 'thumbs' and not (user_id = any(reactions.thumbs)) then array_append(reactions.thumbs, user_id) else reactions.thumbs end,
        frowns = case when reaction_type = 'frowns' and not (user_id = any(reactions.frowns)) then array_append(reactions.frowns, user_id) else reactions.frowns end,
        shocks = case when reaction_type = 'shocks' and not (user_id = any(reactions.shocks)) then array_append(reactions.shocks, user_id) else reactions.shocks end,
        hearts = case when reaction_type = 'hearts' and not (user_id = any(reactions.hearts)) then array_append(reactions.hearts, user_id) else reactions.hearts end,
        laughs = case when reaction_type = 'laughs' and not (user_id = any(reactions.laughs)) then array_append(reactions.laughs, user_id) else reactions.laughs end
    returning *;
  elsif action = 'remove' then
    return query
    insert into reactions (post_id, thumbs, frowns, shocks, hearts, laughs)
    values (post, '{}', '{}', '{}', '{}', '{}')
    on conflict (post_id) do update
    set thumbs = case when reaction_type = 'thumbs' then array_remove(reactions.thumbs, user_id) else reactions.thumbs end,
        frowns = case when reaction_type = 'frowns' then array_remove(reactions.frowns, user_id) else reactions.frowns end,
        shocks = case when reaction_type = 'shocks' then array_remove(reactions.shocks, user_id) else reactions.shocks end,
        hearts = case when reaction_type = 'hearts' then array_remove(reactions.hearts, user_id) else reactions.hearts end,
        laughs = case when reaction_type = 'laughs' then array_remove(reactions.laughs, user_id) else reactions.laughs end
    returning *;
  end if;
end;
$$ language plpgsql;



create or replace function get_bookmarks () returns jsonb as $$
declare
  games_json jsonb;
  boards_json jsonb;
  works_json jsonb;
  user_uuid uuid := auth.uid();
begin
  games_json := COALESCE(
    (
      select jsonb_agg(jsonb_build_object(
        'bookmark_id', b.id,
        'id', g.id,
        'name', g.name,
        'created_at', b.created_at,
        'unread', 
          calculate_unread_count(user_uuid, 'thread-' || g.game_thread::text) +
          calculate_unread_count(user_uuid, 'thread-' || g.discussion_thread::text) +
          calculate_unread_count(user_uuid, 'game-characters-' || g.id::text)
      ))
      from bookmarks b
      left join games g on g.id = b.game_id
      where b.user_id = user_uuid and b.game_id is not null
    ),
    '[]'::jsonb
  );

  boards_json := COALESCE(
    (
      select jsonb_agg(jsonb_build_object(
        'bookmark_id', b.id,
        'id', brd.id,
        'name', brd.name,
        'created_at', b.created_at,
        'unread', calculate_unread_count(user_uuid, 'thread-' || brd.thread::text)
      ))
      from bookmarks b
      left join boards brd on brd.id = b.board_id
      where b.user_id = user_uuid and b.board_id is not null
    ),
    '[]'::jsonb
  );

  works_json := COALESCE(
    (
      select jsonb_agg(jsonb_build_object(
        'bookmark_id', b.id,
        'id', w.id,
        'name', w.name,
        'created_at', b.created_at,
        'unread', calculate_unread_count(user_uuid, 'thread-' || w.thread::text)
      ))
      from bookmarks b
      left join works w on w.id = b.work_id
      where b.user_id = user_uuid and b.work_id is not null
    ),
    '[]'::jsonb
  );

  return jsonb_build_object('games', games_json, 'boards', boards_json, 'works', works_json);
end;
$$ language plpgsql;


create or replace function is_storyteller (game_id int4) returns boolean as $$
begin
  return exists(select 1 from characters where game = game_id and accepted = true and player = auth.uid() and storyteller);
end;
$$ language plpgsql security definer;


create or replace function is_player (game_id int4) returns boolean as $$
begin
  return exists(select 1 from characters where game = game_id and accepted = true and player = auth.uid());
end;
$$ language plpgsql security definer;


create or replace function is_players_character (character_id uuid) returns boolean as $$
begin
  return exists(select 1 from characters where id = character_id and player = auth.uid());
end;
$$ language plpgsql security definer;


create or replace function is_thread_owner (thread_id int4) returns boolean as $$
select exists (
  select 1 from boards where thread = thread_id and owner = auth.uid()
  union all
  select 1 from games where (discussion_thread = thread_id or game_thread = thread_id) and owner = auth.uid()
  union all
  select 1 from works where thread = thread_id and owner = auth.uid()
);
$$ language sql security definer;


create or replace function get_characters () returns json as $$
begin
  return (
    with user_games as (
      select c.game
      from characters c
      where c.player = auth.uid() and c.game is not null
      group by c.game
    ),
    all_characters as (
      select
        g.id as game_id,
        g.name as game_name,
        json_agg(
          json_build_object(
            'name', c.name,
            'id', c.id,
            'portrait', c.portrait,
            'player', c.player,
            'storyteller', c.storyteller,
            'game', c.game,
            'unread', (select coalesce(sum((contact->>'unread')::int), 0) from json_array_elements(c.contacts) as contact),
            'contacts', c.contacts
          ) order by c.name
        ) as characters
      from user_games ug
      join (
        select 
          c.*,
          (
            select json_agg(
              json_build_object(
                'name', other_c.name,
                'id', other_c.id,
                'portrait', other_c.portrait,
                'player', other_c.player,
                'storyteller', other_c.storyteller,
                'unread', coalesce((
                  select count(*)
                  from messages m
                  where m.recipient_character = c.id and m.sender_character = other_c.id and m.read = false and m.sender_character <> c.id
                ), 0),
                'active', (select p.last_activity > current_timestamp - interval '5 minutes' from profiles p where p.id = other_c.player)
              ) order by other_c.name
            )
            from characters other_c
            where other_c.game = c.game and other_c.id <> c.id and other_c.player <> c.player
          ) as contacts
        from characters c
        where c.player = auth.uid()
      ) c on c.game = ug.game
      join games g on g.id = c.game
      group by g.id, g.name
    ),
    stranded_characters as (
      select json_agg(json_build_object('name', c.name, 'id', c.id, 'portrait', c.portrait, 'unread', coalesce((select count(*) from messages m where m.recipient_character = c.id and m.read = false), 0)) order by c.name)
      as characters
      from characters c
      where c.player = auth.uid() and c.game is null
    )
    select json_build_object(
      'allGrouped', (select json_agg(json_build_object('id', game_id, 'name', game_name, 'characters', characters)) from all_characters),
      'myStranded', (select coalesce(characters, '[]'::json) from stranded_characters),
      'unreadTotal', (
        select sum((character->>'unread')::int)
        from (select json_array_elements(characters) as character from all_characters union all select json_array_elements(coalesce(characters, '[]'::json)) as character from stranded_characters)
        as all_unreads
      )
    )
  );
end;
$$ language plpgsql;


create or replace function get_users () returns json as $$
begin
  return (
    with unread_users as (
      select p.id
      from profiles p
      join messages m on m.sender_user = p.id
      where m.recipient_user = auth.uid() and m.read = false
      group by p.id
    ), 
    contacted_users as (
      select p.id
      from profiles p
      join messages m on p.id = m.sender_user or p.id = m.recipient_user
      where (m.sender_user = auth.uid() or m.recipient_user = auth.uid())
      and p.id != auth.uid()
      group by p.id
    ),
    active_users as (select p.id from profiles p where p.last_activity > (now() - interval '5 minutes') and p.id != auth.uid()),
    combined_users as (
      select p.id, p.name, p.portrait,
        (p.id in (select id from unread_users)) as has_unread,
        (p.id in (select id from contacted_users) or p.id in (select id from active_users)) as contacted_or_active,
        (p.last_activity > (now() - interval '5 minutes')) as active,
        (select count(*) from messages m where m.sender_user = p.id and m.recipient_user = auth.uid() and m.read = false) as unread
      from profiles p
      where p.id in (select id from unread_users)
         or p.id in (select id from active_users)
         or p.id in (select id from contacted_users)
      group by p.id
      order by unread desc, active desc, p.name
    )
    select json_agg(c) from combined_users c
  );
end;
$$ language plpgsql;


create or replace function get_sidebar_data () returns json as $$
declare
  bookmarks_data json;
  users_data json;
  characters_data json;
begin
  bookmarks_data := get_bookmarks();
  users_data := get_users();
  characters_data := get_characters();
  return json_build_object('users', users_data, 'characters', characters_data, 'bookmarks', bookmarks_data);
end;
$$ language plpgsql;


create or replace function get_game_unread (game int4, game_thread int4, discussion_thread int4)
  returns jsonb as $$
begin
  return jsonb_build_object(
    'gameChat', calculate_unread_count(auth.uid(), 'thread-' || discussion_thread::text),
    'gameThread', calculate_unread_count(auth.uid(), 'thread-' || game_thread::text),
    'gameCharacters', calculate_unread_count(auth.uid(), 'game-characters-' || game::text)
  );
end;
$$ language plpgsql;


create or replace function get_thread_unread (thread int4) returns integer as $$
begin
  return calculate_unread_count(auth.uid(), 'thread-' || thread::text);
end;
$$ language plpgsql;


create or replace function calculate_unread_count (user_uuid uuid, slug_alias text) returns int as $$
declare
  unread_count int;
  numeric_id int;
begin
  numeric_id := substring(slug_alias from '\d+$')::int; -- Extract numeric part
  if slug_alias like 'thread-%' then
    -- Calculate unread posts for threads
    unread_count := (
      select count(*) from posts p where p.thread = numeric_id and p.created_at > (select coalesce(max(read_at), '1970-01-01')
      from user_reads where user_id = user_uuid and slug = slug_alias)
    );
  elsif slug_alias like 'game-info-%' or slug_alias like 'game-characters-%' then
    -- Calculate unread for game info or characters
    unread_count := (
      select case 
        when coalesce(max(read_at), '1970-01-01') < (
          select case when slug_alias like 'game-info-%' then g.info_changed_at else g.characters_changed_at end
          from games g where g.id = numeric_id
        ) then 1
        else 0
      end
      from user_reads where user_id = user_uuid and slug = slug_alias
    );
  else
    unread_count := 0; -- Default case for unsupported slugs
  end if;
  return unread_count;
end;
$$ language plpgsql;


create or replace function get_game_data (game_id int) returns jsonb as $$
declare
  game_data jsonb;
  character_data jsonb;
  map_data jsonb;
  unread_data jsonb;
  codex_data jsonb;
  subscription_data jsonb;
begin
  select to_jsonb(t) into game_data from (select g.*, p as owner, m as active_map from games g left join profiles p on g.owner = p.id left join maps m on g.active_map = m.id where g.id = game_id) t;
  select jsonb_agg(t) into character_data from (select c.*, p as player from characters c left join profiles p on c.player = p.id where c.game = game_id) t;
  select jsonb_agg(t) into map_data from (select * from maps where game = game_id order by updated_at desc) t;
  select to_jsonb(get_game_unread(game_id, (game_data->>'game_thread')::int, (game_data->>'discussion_thread')::int)) into unread_data where auth.uid() is not null; -- only calculate unread if user is logged in
  select jsonb_agg(t) into codex_data from (select * from codex_sections where game = game_id order by index) t;
  select to_jsonb(t) into subscription_data from (select * from subscriptions where user_id = auth.uid() and game = game_id) t;
  return game_data || jsonb_build_object('characters', character_data, 'maps', map_data, 'unread', unread_data, 'codexSections', codex_data, 'subscription', subscription_data);
end;
$$ language plpgsql;


create or replace function get_notification_data (post_id int) returns jsonb as $$
declare
  game_id int;
  post_owner_user_id uuid;
  is_public boolean;
  audience uuid[];
  user_ids uuid[];
  user_data jsonb;
begin
  -- Retrieve game ID, audience, and the owner's user ID based on the character who owns the post
  select c.game, p.audience, c.player into game_id, audience, post_owner_user_id
  from posts p
  join characters c on c.id = p.owner
  where p.id = post_id and p.owner_type = 'character';

  -- RAISE log 'Game ID: %, Audience: %, Post Owner User ID: %', game_id, audience, post_owner_user_id;

  -- If no game_id was set, it means the post owner_type isn't 'character'
  if game_id is null then
    -- RAISE log 'Exiting because game_id is null.';
    return '[]'::jsonb;
  end if;

  -- Check if the post is public
  is_public := (audience is null);

  if is_public then
    -- Fetch all player IDs for a public post
    select array_agg(distinct c.player) into user_ids from characters c
    where c.game = game_id;
    -- RAISE log 'User IDs for public post: %', user_ids;
  else
    -- Fetch player IDs based on specified character IDs in the audience
    select array_agg(distinct c.player) into user_ids from characters c
    where c.id = any(audience);
    -- RAISE log 'User IDs for specified audience: %', user_ids;
  end if;

  -- Fetch user notification preferences and contact details
  select jsonb_agg(jsonb_build_object('user_id', pr.id, 'name', pr.name, 'notification', s.notification, 'email', s.email, 'email_address', au.email))
  into user_data
  from profiles pr
  join auth.users au on pr.id = au.id
  join subscriptions s on pr.id = s.user_id
  where pr.id = any(user_ids) and pr.id != post_owner_user_id and
        (pr.last_activity is null or pr.last_activity < now() - interval '5 minutes') and
        s.game = game_id
  group by pr.id, s.notification, s.email, au.email;

  -- RAISE log 'Final user data: %', user_data;

  return coalesce(user_data, '[]'::jsonb);
end;
$$ language plpgsql;


create or replace function delete_my_character(character_id uuid)
returns void as $$
begin
  -- first, try to update characters that are part of a game
  update characters set game = null, player = null where id = character_id and player = (select auth.uid()) and game is not null;
  -- if the character was not part of a game, attempt to delete it
  if not found then
    delete from characters
    where id = character_id and player = (select auth.uid()) and game is null;
    if not found then raise exception 'you do not have permission to delete this character.'; end if;
  end if;
end;
$$ language plpgsql security definer;


create or replace function delete_old_chat_posts () returns void as $$
begin
  delete from posts where id not in (select id from posts where thread = 1 order by created_at desc limit 100);
end;
$$ language plpgsql;


create or replace function upsert_user_read (p_user_id uuid, p_slug text) returns void as $$
begin
  insert into user_reads (user_id, slug, read_at)
  values (p_user_id, p_slug, now())
  on conflict (user_id, slug) do update set read_at = now();
end;
$$ language plpgsql;


create or replace function update_updated_at () returns trigger as $$
begin
  new.updated_at := current_timestamp;
  return new;
end;
$$ language plpgsql;


create or replace function add_default_bookmarks () returns trigger as $$
begin
  insert into bookmarks (user_id, board_id) values (new.id, 1);
  insert into bookmarks (user_id, board_id) values (new.id, 2);
  return new;
end;
$$ language plpgsql;


create or replace function get_user_names (ids uuid[]) returns jsonb as $$
begin
  return (select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name)) from profiles p where p.id = any(ids));
end;
$$ language plpgsql;


create or replace function delete_user () returns void as $$
  delete from auth.users where id = auth.uid();
$$ language sql security definer;


-- TRIGGERS --------------------------------------------


create or replace trigger add_storyteller after insert on games for each row execute function add_storyteller ();
create or replace trigger add_game_threads before insert on games for each row execute function add_game_threads ();
create or replace trigger delete_game_threads after delete on games for each row execute procedure delete_game_threads();
create or replace trigger add_board_thread before insert on boards for each row execute function add_thread ();
create or replace trigger delete_board_thread after delete on boards for each row execute procedure delete_thread();
create or replace trigger add_work_thread before insert on works for each row execute function add_thread ();
create or replace trigger delete_work_thread after delete on works for each row execute procedure delete_thread();
create or replace trigger update_map_updated_at before update on maps for each row execute procedure update_updated_at();
create or replace trigger update_codex_updated_at before update on codex_pages for each row execute procedure update_updated_at();
create or replace trigger add_default_bookmarks after insert on profiles for each row execute function add_default_bookmarks();


-- WEBHOOKS --------------------------------------------


create trigger notify after insert on public.posts for each row
execute function supabase_functions.http_request (
  'https://zwclrcefxleqmzhhfcte.supabase.co/functions/v1/notify', 'POST', '{ "Content-Type":"application/json" }', '{}', '1000'
);


-- CRON --------------------------------------------


CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 5 * * *', $$CALL delete_oldest_posts()$$);


-- STORAGE  --------------------------------------------


insert into storage.buckets (id, name, public) values ('headers', 'headers', true);
insert into storage.buckets (id, name, public) values ('portraits', 'portraits', true);
insert into storage.buckets (id, name, public) values ('posts', 'posts', true);
insert into storage.buckets (id, name, public) values ('maps', 'maps', true);


-- SEED  --------------------------------------------


-- Run as a user session, or replace auth.uid() with a user id
-- Disable the trigger "add_default_bookmarks" to create a user manually in the profiles table.

insert into threads (name) values ('Chat'); -- has to be ID 1
insert into public.boards (name, owner) values ('Nápověda', auth.uid())
insert into public.boards (name, owner) values ('Správa Andoru', auth.uid())
