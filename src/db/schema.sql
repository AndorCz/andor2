
drop table if exists profiles cascade;
drop table if exists threads cascade;
drop table if exists games cascade;
drop table if exists characters cascade;
drop table if exists posts cascade;
drop table if exists messages cascade;
drop table if exists boards cascade;
drop table if exists bookmarks cascade;
drop table if exists user_reads cascade;

drop type if exists character_state;
drop type if exists game_system;
drop type if exists game_category;
drop type if exists work_type;
drop type if exists work_tag;
drop type if exists work_category;

drop view if exists posts_owner;
drop view if exists board_list;
drop view if exists game_list;
drop view if exists work_list;
drop view if exists last_posts;

-- ENUMS

create type character_state as enum ('alive', 'unconscious', 'dead');
create type game_system as enum ('base', 'vampire5', 'yearzero', 'dnd5', 'drd1', 'cyberpunk', 'starwars', 'cthulhu', 'warhammer', 'shadowrun', 'pathfinder', 'mutant', 'gurps', 'fate', 'savage', 'dungeonworld', 'other');
create type game_category as enum ('anime', 'cyberpunk', 'detective', 'based', 'fantasy', 'furry', 'history', 'horror', 'comedy', 'scifi', 'steampunk', 'strategy', 'survival', 'urban', 'relationship', 'other');
create type work_type as enum ('text', 'image', 'audio');
create type work_tag as enum ('story', 'fantasy', 'steampunk', 'scifi', 'horror', 'detective', 'thriller', 'romance', 'dystopia', 'poem', 'epos', 'drama', 'haiku', 'sonnet', 'freeverse', 'tragedy', 'comedy', 'tragicomedy', 'monodrama', 'experimental', 'screenplay', 'fromlife', 'biography', 'essay', 'history', 'motivational', 'fairytale', 'educational', 'comics', 'superhero', 'manga', 'travel', 'religion', 'science', 'technology', 'futurism', 'philosophy', 'rpg', 'larp', 'fanfiction', 'erotica', 'parody', 'city', 'countryside', 'space', 'vampires', 'werewolves', 'zombies', 'magic', 'warhammer', 'dnd', 'drd', 'cyberpunk', 'shadowrun', 'cthulhu', 'lotr', 'harrypotter', 'starwars', 'startrek', 'andor');
create type work_category as enum ('prose', 'poetry', 'game', 'other');

-- TABLES

create table profiles (
  id uuid not null primary key,
  name text unique not null,
  portrait text,
  created_at timestamp with time zone default current_timestamp,
  last_activity timestamp with time zone,
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

create table threads (
  id int4 not null primary key generated always as identity,
  name text null,
  created_at timestamp with time zone default current_timestamp
);

create table games (
  id int4 not null primary key generated always as identity,
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
  open_discussion boolean not null default false,
  open_info boolean not null default true,
  game_thread int4 null,
  openai_thread text null,
  openai_storyteller text null,
  custom_header text null,
  created_at timestamp with time zone default current_timestamp,
  info_changed_at timestamp with time zone default current_timestamp,
  characters_changed_at timestamp with time zone default current_timestamp,
  constraint games_owner_fkey foreign key (owner) references profiles(id) on delete restrict,
  constraint games_discussion_thread_fkey foreign key (discussion_thread) references threads(id),
  constraint games_game_thread_fkey foreign key (game_thread) references threads (id)
);

create table boards (
  id int4 not null primary key generated always as identity,
  name text unique not null,
  owner uuid not null default auth.uid(),
  header text null default 'Popis tematického zaměření této diskuze, užitečné odkazy, pravidla etc.'::text,
  thread int4 null,
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
  storyteller boolean not null default false,
  open boolean not null default false,
  accepted boolean not null default false,
  state public.character_state not null default 'alive'::character_state,
  constraint characters_game_fkey foreign key (game) references games (id) on delete cascade,
  constraint characters_player_fkey foreign key (player) references profiles (id) on delete cascade
);

create table works (
  id int4 not null primary key generated always as identity,
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
  created_at timestamp with time zone default current_timestamp
  constraint works_owner_fkey foreign key (owner) references profiles (id) on delete set null
);

create table posts (
  id int4 not null primary key generated always as identity,
  thread int4,
  owner uuid,
  owner_type text not null,
  content text,
  thumbs uuid[] null default '{}'::uuid[],
  frowns uuid[] null default '{}'::uuid[],
  hearts uuid[] null default '{}'::uuid[],
  laughs uuid[] null default '{}'::uuid[],
  audience uuid[] null,
  openai_post text null,
  moderated boolean default false,
  dice boolean default false,
  created_at timestamp with time zone default current_timestamp,
  constraint posts_thread_fkey foreign key (thread) references threads (id) on delete cascade
);

create table messages (
  id int4 not null primary key generated always as identity,
  sender_user uuid,
  recipient_user uuid,
  sender_character uuid,
  recipient_character uuid,
  content text,
  read boolean default false,
  moderated boolean default false,
  created_at timestamp with time zone default current_timestamp,
  constraint messages_sender_user_fkey foreign key (sender_user) references profiles (id) on delete cascade,
  constraint messages_recipient_user_fkey foreign key (recipient_user) references profiles (id) on delete cascade
  constraint messages_sender_character_fkey foreign key (sender_character) references characters (id) on delete cascade,
  constraint messages_recipient_character_fkey foreign key (recipient_character) references characters (id) on delete cascade
);

create table bookmarks (
  id int4 not null primary key generated always as identity,
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

-- VIEWS

create view posts_owner as
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
    get_character_names(p.audience) AS audience_names
  from posts p
  left join profiles on p.owner = profiles.id and p.owner_type = 'user'
  left join characters on p.owner = characters.id and p.owner_type = 'character';
  order by p.created_at desc;

create view board_list as
  select b.*, pr.id as owner_id, pr.name as owner_name, count(p.id) as post_count
  from boards b
    left join threads t on b.thread = t.id
    left join profiles pr on b.owner = pr.id
    left join posts p on t.id = p.thread
  group by b.id, pr.id, pr.name
  order by b.created_at desc;

create view game_list as
  select g.*, pr.id as owner_id, pr.name as owner_name, count(p.id) as post_count
  from games g
    left join threads t on g.game_thread = t.id
    left join profiles pr on g.owner = pr.id
    left join posts p on t.id = p.thread
  group by g.id, pr.id, pr.name
  order by g.created_at desc;

create view work_list as
  select w.*, pr.id as owner_id, pr.name as owner_name, count(p.id) as post_count
  from works w
    left join threads t on w.thread = t.id
    left join profiles pr on w.owner = pr.id
    left join posts p on t.id = p.thread
  group by w.id, pr.id, pr.name
  order by w.created_at desc;

create or replace view last_posts as
select p.id, p.content, p.created_at,
  case
    when g.id is not null then 'game'
    when b.id is not null then 'board'
    when w.id is not null then 'work'
  end as content_type,
  coalesce(g.id::text, b.id::text, w.id::text) as content_id,
  p.owner,
  p.owner_type,
  case 
    when p.owner_type = 'user' then pr.name
    when p.owner_type = 'character' then ch.name
  end as owner_name,
  case 
    when p.owner_type = 'user' then pr.portrait
    when p.owner_type = 'character' then ch.portrait
  end as owner_portrait,
  case
    when g.id is not null then g.name
    when b.id is not null then b.name
    when w.id is not null then w.name
  end as content_name
from
  posts p
  left join games g on p.thread = g.game_thread
  left join boards b on p.thread = b.thread
  left join works w on p.thread = w.thread
  left join profiles pr on p.owner = pr.id and p.owner_type = 'user'
  left join characters ch on p.owner = ch.id and p.owner_type = 'character'
where
  p.audience is null and (g.id is not null or b.id is not null or w.id is not null) and p.dice = FALSE
order by
  p.created_at desc
limit 10;


-- FUNCTIONS


create or replace function add_storyteller() returns trigger as $$
begin
  insert into characters (name, game, player, accepted, storyteller) values ('Vypravěč', new.id, new.owner, true, true);
  return new;
end;
$$ language plpgsql;


create or replace function add_game_threads () returns trigger as $$
begin
  insert into threads (name) values (new.name || ' - discussion') returning id into new.discussion_thread;
  insert into threads (name) values (new.name || ' - game') returning id into new.game_thread;
  return new;
end;
$$ language plpgsql;


create or replace function delete_game_threads() returns trigger as $$
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


create or replace function delete_thread() returns trigger as $$
begin
  delete from threads where id = old.thread;
  return old;
end;
$$ language plpgsql;


create or replace function get_character_names(audience_ids uuid[])
returns text[] as $$
declare
  names text[];
begin
  select array_agg(name) into names
  from unnest(audience_ids) as audience_id
  join characters on characters.id = audience_id;
  return names;
end;
$$ language plpgsql;


create or replace function get_game_posts(thread_id integer, game_id integer, owners uuid[], _limit integer, _offset integer)
returns json as $$
declare
  is_storyteller boolean;
  player_characters uuid[];
begin
  -- check if the user is a storyteller in this game
  select exists(select 1 from characters where game = game_id and player = auth.uid() and storyteller) into is_storyteller;

  -- get array of player's character ids
  select array_agg(id) into player_characters from characters where game = game_id and player = auth.uid();

  return (
    with filtered_posts as (
      select p.* from posts_owner p where p.thread = thread_id
      and (
        p.audience is null or is_storyteller or
        (not is_storyteller and (p.audience && player_characters or p.owner = any(player_characters)))
      )
      and (owners is null or p.owner = any(owners))
    ), ordered_posts as (select * from filtered_posts order by created_at desc limit _limit offset _offset)
    select json_build_object(
      'posts', (select json_agg(op) from ordered_posts op),
      'count', (select count(*) from filtered_posts)
    )
  );
end;
$$ language plpgsql;


create or replace function update_reaction(post_id int4, reaction_type text, action text)
returns setof posts as $$
begin
  if action = 'add' then
    return query
    update posts
    set
      thumbs = case when reaction_type = 'thumbs' and not (auth.uid() = any(thumbs)) then array_append(thumbs, auth.uid()) else thumbs end,
      frowns = case when reaction_type = 'frowns' and not (auth.uid() = any(frowns)) then array_append(frowns, auth.uid()) else frowns end,
      hearts = case when reaction_type = 'hearts' and not (auth.uid() = any(hearts)) then array_append(hearts, auth.uid()) else hearts end,
      laughs = case when reaction_type = 'laughs' and not (auth.uid() = any(laughs)) then array_append(laughs, auth.uid()) else laughs end
    where id = post_id
    returning *;
  elsif action = 'remove' then
    return query
    update posts
    set
      thumbs = case when reaction_type = 'thumbs' then array_remove(thumbs, auth.uid()) else thumbs end,
      frowns = case when reaction_type = 'frowns' then array_remove(frowns, auth.uid()) else frowns end,
      hearts = case when reaction_type = 'hearts' then array_remove(hearts, auth.uid()) else hearts end,
      laughs = case when reaction_type = 'laughs' then array_remove(laughs, auth.uid()) else laughs end
    where id = post_id
    returning *;
  end if;
end;
$$ language plpgsql;


create or replace function get_bookmarks()
returns jsonb as $$
declare
  games_json jsonb;
  boards_json jsonb;
  works_json jsonb;
  user_uuid uuid := auth.uid();
begin
  games_json := (
    select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'game_id', g.id,
      'name', g.name,
      'created_at', b.created_at,
      'unread', 
        calculate_unread_count(user_uuid, 'thread-' || g.game_thread::text) +
        calculate_unread_count(user_uuid, 'thread-' || g.discussion_thread::text) +
        calculate_unread_count(user_uuid, 'game-info-' || g.id::text) +
        calculate_unread_count(user_uuid, 'game-characters-' || g.id::text)
    ))
    from bookmarks b
    left join games g on g.id = b.game_id
    where b.user_id = user_uuid and b.game_id is not null
  );

  boards_json := (
    select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'board_id', brd.id,
      'name', brd.name,
      'created_at', b.created_at,
      'unread', calculate_unread_count(user_uuid, 'thread-' || brd.thread::text)
    ))
    from bookmarks b
    left join boards brd on brd.id = b.board_id
    where b.user_id = user_uuid and b.board_id is not null
  );

  works_json := (
    select jsonb_agg(jsonb_build_object(
      'id', b.id,
      'work_id', w.id,
      'name', w.name,
      'created_at', b.created_at,
      'unread', calculate_unread_count(user_uuid, 'thread-' || w.thread::text)
    ))
    from bookmarks b
    left join works w on w.id = b.work_id
    where b.user_id = user_uuid and b.work_id is not null
  );

  return jsonb_build_object('games', games_json, 'boards', boards_json, 'works', works_json);
end;
$$ language plpgsql;


create or replace function get_characters()
returns json as $$
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
            'unread', (select coalesce(sum((contact->>'unread')::int), 0) 
                       from json_array_elements(c.contacts) as contact),
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
                  where m.recipient_character = c.id and m.sender_character = other_c.id and m.read = false
                    and m.sender_character <> c.id
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
      select json_agg(
        json_build_object(
          'name', c.name,
          'id', c.id,
          'portrait', c.portrait,
          'unread', coalesce((select count(*) from messages m where m.recipient_character = c.id and m.read = false), 0)
        ) order by c.name
      ) as characters
      from characters c
      where c.player = auth.uid() and c.game is null
    )
    select json_build_object(
      'allGrouped', (select json_agg(json_build_object('id', game_id, 'name', game_name, 'characters', characters)) from all_characters),
      'myStranded', (select coalesce(characters, '[]'::json) from stranded_characters),
      'unreadTotal', (
        select sum((character->>'unread')::int)
        from (
          select json_array_elements(characters) as character
          from all_characters
          union all
          select json_array_elements(coalesce(characters, '[]'::json)) as character
          from stranded_characters
        ) as all_unreads
      )
    )
  );
end;
$$ language plpgsql;



create or replace function get_users()
  returns json as $$
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
    active_users as (
      select p.id
      from profiles p
      where p.last_activity > (now() - interval '5 minutes') and p.id != auth.uid()
    ),
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


create or replace function get_sidebar_data()
  returns json as $$
declare
  users_data json;
  characters_data json;
begin
  users_data := get_users();
  characters_data := get_characters();
  return json_build_object('users', users_data, 'characters', characters_data);
end;
$$ language plpgsql;


create or replace function get_game_unread(game int4, game_thread int4, discussion_thread int4)
returns jsonb as $$
begin
  return jsonb_build_object(
    'gameInfo', calculate_unread_count(auth.uid(), 'game-info-' || game::text),
    'gameChat', calculate_unread_count(auth.uid(), 'thread-' || discussion_thread::text),
    'gameThread', calculate_unread_count(auth.uid(), 'thread-' || game_thread::text),
    'gameCharacters', calculate_unread_count(auth.uid(), 'game-characters-' || game::text)
  );
end;
$$ language plpgsql;


create or replace function get_thread_unread(thread int4)
returns integer as $$
begin
  return calculate_unread_count(auth.uid(), 'thread-' || thread::text);
end;
$$ language plpgsql;


create or replace function calculate_unread_count(user_uuid uuid, slug_alias text)
returns int as $$
declare
  unread_count int;
  numeric_id int;
begin
  numeric_id := substring(slug_alias from '\d+$')::int; -- Extract numeric part

  if slug_alias like 'thread-%' then
    -- Calculate unread posts for threads
    unread_count := (
      select count(*) 
      from posts p
      where p.thread = numeric_id
      and p.created_at > (
        select coalesce(max(read_at), '1970-01-01')
        from user_reads
        where user_id = user_uuid and slug = slug_alias
      )
    );
  elsif slug_alias like 'game-info-%' or slug_alias like 'game-characters-%' then
    -- Calculate unread for game info or characters
    unread_count := (
      select case 
        when coalesce(max(read_at), '1970-01-01') < (
          select case 
            when slug_alias like 'game-info-%' then g.info_changed_at 
            else g.characters_changed_at 
          end
          from games g
          where g.id = numeric_id
        ) then 1
        else 0
      end
      from user_reads
      where user_id = user_uuid and slug = slug_alias
    );
  else
    unread_count := 0; -- Default case for unsupported slugs
  end if;

  return unread_count;
end;
$$ language plpgsql;


create or replace function delete_old_chat_posts()
  returns void as $$
begin
  delete from posts
  where id not in (
    select id from posts
    where thread = 1 -- chat thread
    order by created_at desc
    limit 100
  );
end;
$$ language plpgsql;


create or replace function upsert_user_read(p_user_id uuid, p_slug text)
  returns void as $$
begin
  insert into user_reads (user_id, slug, read_at)
  values (p_user_id, p_slug, now())
  on conflict (user_id, slug) do update set read_at = now();
end;
$$ language plpgsql;


-- TRIGGERS

create or replace trigger add_storyteller after insert on games for each row execute function add_storyteller ();
create or replace trigger add_game_threads before insert on games for each row execute function add_game_threads ();
create or replace trigger delete_game_threads after delete on games for each row execute procedure delete_game_threads();
create or replace trigger add_board_thread before insert on boards for each row execute function add_thread ();
create or replace trigger delete_board_thread after delete on boards for each row execute procedure delete_thread();
create or replace trigger add_work_thread before insert on works for each row execute function add_thread ();
create or replace trigger delete_work_thread after delete on works for each row execute procedure delete_thread();

-- SEED

insert into threads (name) values ('Chat'); -- has to be ID 1


-- CRON

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('0 5 * * *', $$CALL delete_oldest_posts()$$);
