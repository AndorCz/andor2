DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS posts CASCADE;

CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE games (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  author UUID NOT NULL DEFAULT auth.uid(),
  intro TEXT NULL DEFAULT 'Popis světa, úvod do příběhu apod.'::TEXT,
  info TEXT NULL DEFAULT 'Informace o pravidlech, tvorbě postav, náboru nových hráčů, četnosti hraní apod.'::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT games_author_fkey FOREIGN KEY (author) REFERENCES profiles (id) ON DELETE RESTRICT
);

CREATE TABLE characters (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  game UUID NOT NULL,
  author UUID NOT NULL,
  player UUID,
  name TEXT,
  FOREIGN KEY (game) REFERENCES games(id),
  FOREIGN KEY (author) REFERENCES auth.users(id)
  FOREIGN KEY (player) REFERENCES auth.users(id)
);

  - Name
- Icon
- Bio
  - Author
  - Player
  - Game
- Open
- Hidden
- Conscious
- Alive


CREATE TABLE posts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  game UUID,
  author UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game) REFERENCES games(id),
  FOREIGN KEY (author) REFERENCES auth.users(id)
);
