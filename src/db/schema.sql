drop table if exists profiles cascade;
drop table if exists threads cascade;
drop table if exists games cascade;
drop table if exists characters cascade;
drop table if exists posts cascade;

drop type if exists character_state;
drop type if exists game_system;

create type character_state as enum ('alive', 'unconscious', 'dead');
create type game_system as enum ('-', 'vampire5e', 'drd1'); -- 'fate', 'dnd5e'

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
  created_at timestamp with time zone default current_timestamp,
  constraint games_owner_fkey foreign key (owner) references profiles(id) on delete restrict,
  constraint games_discussion_fkey foreign key (discussion) references threads(id) on delete cascade
);

create table characters (
  id uuid not null primary key default gen_random_uuid(),
  game int2,
  owner uuid not null,
  player uuid,
  portrait text,
  name text,
  bio text,
  open boolean not null default false,
  accepted boolean not null default false,
  hidden boolean not null default true,
  state public.character_state not null default 'alive'::character_state,
  foreign key (game) references games(id),
  foreign key (owner) references profiles(id),
  foreign key (player) references profiles(id)
);

create table posts (
  id uuid not null primary key default gen_random_uuid(),
  thread int2,
  owner uuid,
  content text,
  created_at timestamp with time zone default current_timestamp,
  foreign key (thread) references threads(id),
  foreign key (owner) references profiles(id)
);

-- functions

create or replace function add_game_discussion () returns trigger as $$
begin
  insert into threads (name, created_at) values (new.name, current_timestamp) returning id into new.discussion;
  return new;
end;
$$ language plpgsql;

-- triggers

create or replace trigger add_game_discussion before insert on games for each row execute function add_game_discussion ();
