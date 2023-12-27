
drop table if exists profiles cascade;
drop table if exists threads cascade;
drop table if exists games cascade;
drop table if exists characters cascade;
drop table if exists posts cascade;

drop type if exists character_state;
drop type if exists game_system;

drop view if exists posts_owner;

-- ENUMS

create type character_state as enum ('alive', 'unconscious', 'dead');
create type game_system as enum ('-', 'vampire5e', 'drd1'); -- 'fate', 'dnd5e'

-- TABLES

create table profiles (
  id uuid not null primary key,
  name text unique not null,
  portrait text,
  created_at timestamp with time zone default current_timestamp,
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
  intro text null default 'Popis světa, úvod do příběhu apod. Z tohoto textu vychází AI asistent pro přípravu *podkladů pro vypravěče* níže.'::text,
  info text null default 'Informace o pravidlech, tvorbě postav, náboru nových hráčů, četnosti hraní apod.'::text,
  secrets text null default 'Pouze pro vypravěče. Poznámky a tajné informace o příběhu. primárně z tohoto textu vychází AI vypravěč pro tvorbu příběhu.'::text,
  system public.game_system not null default '-'::game_system,
  discussion int2 null,
  game int2 null,
  openai_thread text null,
  openai_storyteller text null,
  custom_header boolean null,
  created_at timestamp with time zone default current_timestamp,
  constraint games_owner_fkey foreign key (owner) references profiles(id) on delete restrict,
  constraint games_discussion_fkey foreign key (discussion) references threads(id),
  constraint games_game_fkey foreign key (game) references threads (id)
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
  constraint characters_player_fkey foreign key (player) references profiles (id)
);

create table posts (
  id uuid not null primary key default gen_random_uuid(),
  thread int2,
  owner uuid,
  owner_type text not null,
  content text,
  audience uuid[] null,
  openai_post text null,
  created_at timestamp with time zone default current_timestamp,
  constraint posts_thread_fkey foreign key (thread) references threads (id) on delete cascade
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
  insert into threads (name) values (new.name || ' - discussion') returning id into new.discussion;
  insert into threads (name) values (new.name || ' - game') returning id into new.game;
  return new;
end;
$$ language plpgsql;

create or replace function delete_game_threads() returns trigger as $$
begin
  delete from threads where id = old.discussion;
  delete from threads where id = old.game;
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

-- TRIGGERS

create or replace trigger add_storyteller after insert on games for each row execute function add_storyteller ();
create or replace trigger add_game_threads before insert on games for each row execute function add_game_threads ();
create or replace trigger delete_game_threads after delete on games for each row execute procedure delete_game_threads();
