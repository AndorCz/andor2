DROP TABLE IF EXISTS game_users CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE games (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name NOT NULL TEXT,
  author UUID NOT NULL default auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  CONSTRAINT games_author_fkey FOREIGN KEY (author) REFERENCES auth.users (id) ON DELETE restrict
);

CREATE TABLE players (
  game_id NOT NULL UUID,
  user_id NOT NULL UUID,
  character_name TEXT,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE posts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
