
drop table if exists profiles cascade;
drop table if exists threads cascade;
drop table if exists games cascade;
drop table if exists characters cascade;
drop table if exists posts cascade;
drop table if exists messages cascade;
drop table if exists boards cascade;
drop table if exists bookmarks cascade;

drop type if exists character_state;
drop type if exists game_system;

drop view if exists posts_owner;

-- ENUMS

create type character_state as enum ('alive', 'unconscious', 'dead');
create type game_system as enum ('-', 'vampire5e', 'dnd5e', 'drd1'); -- 'fate'

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
  id int2 primary key generated always as identity,
  name text null,
  created_at timestamp with time zone default current_timestamp
);

create table games (
  id int2 primary key generated always as identity,
  name text unique not null,
  owner uuid not null default auth.uid(),
  intro text null default 'Popis světa, úvod do příběhu apod. (Z tohoto textu také vychází AI asistent pro přípravu *podkladů pro vypravěče* níže.)'::text,
  info text null default 'Informace o pravidlech, tvorbě postav, náboru nových hráčů, četnosti hraní apod.'::text,
  secrets text null default 'Pouze pro vypravěče. Poznámky a tajné informace o příběhu. primárně z tohoto textu vychází AI vypravěč pro tvorbu příběhu.'::text,
  system public.game_system not null default '-'::game_system,
  discussion_thread int2 null,
  game_thread int2 null,
  openai_thread text null,
  openai_storyteller text null,
  custom_header boolean null,
  created_at timestamp with time zone default current_timestamp,
  constraint games_owner_fkey foreign key (owner) references profiles(id) on delete restrict,
  constraint games_discussion_thread_fkey foreign key (discussion_thread) references threads(id),
  constraint games_game_fkey foreign key (game) references threads (id)
);

create table boards (
  id int2 primary key generated always as identity,
  name text unique not null,
  owner uuid not null default auth.uid(),
  header text null default 'Popis tematického zaměření této diskuze, užitečné odkazy, pravidla etc.'::text,
  thread int2 null,
  custom_header boolean null,
  created_at timestamp with time zone default current_timestamp,
  constraint boards_owner_fkey foreign key (owner) references profiles(id) on delete restrict,
  constraint boards_thread_fkey foreign key (thread) references threads(id)
);

create table characters (
  id uuid not null primary key default gen_random_uuid(),
  game int2,
  player uuid,
  portrait text,
  name text,
  bio text,
  appearance text,
  storyteller boolean not null default false,
  open boolean not null default false,
  accepted boolean not null default false,
  hidden boolean not null default true,
  state public.character_state not null default 'alive'::character_state,
  constraint characters_game_fkey foreign key (game) references games (id) on delete cascade,
  constraint characters_player_fkey foreign key (player) references profiles (id) on delete cascade
);

create table posts (
  id uuid not null primary key default gen_random_uuid(),
  thread int2,
  owner uuid,
  owner_type text not null,
  content text,
  thumbs uuid[] null,
  frowns uuid[] null,
  hearts uuid[] null,
  laughs uuid[] null,
  audience uuid[] null,
  openai_post text null,
  dice boolean default false,
  created_at timestamp with time zone default current_timestamp,
  constraint posts_thread_fkey foreign key (thread) references threads (id) on delete cascade
);

create table messages (
  id uuid not null primary key default gen_random_uuid(),
  sender uuid,
  recipient uuid,
  content text,
  read boolean default false,
  moderated boolean default false,
  created_at timestamp with time zone default current_timestamp,
  constraint messages_sender_fkey foreign key (sender) references profiles (id) on delete cascade,
  constraint messages_recipient_fkey foreign key (recipient) references profiles (id) on delete cascade
);

create table bookmarks (
  id serial primary key,
  user_id uuid references profiles(id) on delete cascade,
  game_id int2 null references games(id),
  board_id int2 null references boards(id),
  created_at timestamp with time zone default current_timestamp
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

-- FUNCTIONS

create or replace function add_storyteller() returns trigger as $$
begin
  insert into characters (name, game, player, hidden, accepted, storyteller) values ('Vypravěč', new.id, new.owner, false, true, true);
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

create or replace function add_board_thread () returns trigger as $$
begin
  insert into threads (name) values (new.name) returning id into new.thread;
  return new;
end;
$$ language plpgsql;

create or replace function delete_board_thread() returns trigger as $$
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

create or replace function update_reaction(post_id uuid, reaction_type text, action text)
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

-- TRIGGERS

create or replace trigger add_storyteller after insert on games for each row execute function add_storyteller ();
create or replace trigger add_game_threads before insert on games for each row execute function add_game_threads ();
create or replace trigger delete_game_threads after delete on games for each row execute procedure delete_game_threads();
create or replace trigger add_board_thread before insert on boards for each row execute function add_board_thread ();
create or replace trigger delete_board_thread after delete on boards for each row execute procedure delete_board_thread();
