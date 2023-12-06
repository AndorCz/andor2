DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TYPE IF EXISTS character_state;

CREATE TYPE character_state AS ENUM ('alive', 'unconscious', 'dead');

CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE games (
  id INT2 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL,
  owner UUID NOT NULL DEFAULT auth.uid(),
  intro TEXT NULL DEFAULT 'Popis světa, úvod do příběhu apod.'::TEXT,
  info TEXT NULL DEFAULT 'Informace o pravidlech, tvorbě postav, náboru nových hráčů, četnosti hraní apod.'::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT games_owner_fkey FOREIGN KEY (owner) REFERENCES profiles(id) ON DELETE RESTRICT
);

CREATE TABLE characters (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  game INT2,
  owner UUID NOT NULL,
  player UUID,
  portrait TEXT,
  name TEXT,
  bio TEXT,
  open BOOLEAN NOT NULL DEFAULT false,
  accepted BOOLEAN NOT NULL DEFAULT false,
  hidden BOOLEAN NOT NULL DEFAULT true,
  state public.character_state NOT NULL DEFAULT 'alive'::character_state,
  FOREIGN KEY (game) REFERENCES games(id),
  FOREIGN KEY (owner) REFERENCES profiles(id),
  FOREIGN KEY (player) REFERENCES profiles(id)
);

CREATE TABLE posts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  game INT2,
  owner UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game) REFERENCES games(id),
  FOREIGN KEY (owner) REFERENCES profiles(id)
);
