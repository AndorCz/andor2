

-- USER --------------------------------------------


-- Profiles --

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; -- (Written 0/3, Tested+Published 0/3)

-- Allow everyone to read profiles
-- Allow users to change their profiles
-- Allow users to delete their profiles

-- Bookmarks --

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY; -- (3/3, 0/3)

CREATE POLICY "Allow users to read their own bookmarks + game joining" ON public.bookmarks FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (game_id IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));
CREATE POLICY "Allow users to add their own bookmarks + game joining" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR (game_id IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));
CREATE POLICY "Allow users to delete their own bookmarks" ON public.bookmarks FOR DELETE TO authenticated USING ((user_id = auth.uid()));


-- BOARDS --------------------------------------------

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY; -- (4/4, 0/4)

CREATE POLICY "Enable read access to all users" ON public.boards FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.boards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update for owner" ON public.boards FOR UPDATE TO authenticated USING ((owner = auth.uid())) WITH CHECK ((owner = auth.uid()));
CREATE POLICY "Allow delete for owner" ON public.boards FOR DELETE TO authenticated USING ((owner = auth.uid()));


-- GAMES --------------------------------------------

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY; -- (4/4, 0/4)

-- Allow everyone to read list of games
-- Allow authenticated users to create games
-- Allow users to delete their own games
-- Allow users to update their own games

-- Characters --

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY; -- (0/6, 0/6)

-- Allow everyone to read characters in game.open_game
-- Allow players to read characters
CREATE POLICY "Allow players to create characters" ON public.characters FOR INSERT TO authenticated WITH CHECK ((player = auth.uid()));
CREATE POLICY "Allow players to delete their own characters" ON public.characters FOR DELETE TO authenticated USING ((player = auth.uid()));
CREATE POLICY "Allow users to update their own characters" ON public.characters FOR UPDATE TO authenticated USING ((player = auth.uid())) WITH CHECK ((player = auth.uid()));
-- Allow storytellers to update all characters

            ------- archive
            ------- CREATE POLICY "Allow everyone to see characters" ON public.characters FOR SELECT TO anon USING (true);
            ------- CREATE POLICY "Allow users to see characters" ON public.characters FOR SELECT TO authenticated USING (true);
            ------- CREATE POLICY "Accept character to game" ON public.characters FOR UPDATE USING (((game = ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))) AND (accepted = false))) WITH CHECK ((game = ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));

-- Codex sections --

ALTER TABLE public.codex_sections ENABLE ROW LEVEL SECURITY; -- (0/5, 0/5)

-- Allow everyone to read public codex sections (game.open_codex)
-- Allow players of the game to read codex sections
-- Allow storytellers to create codex sections
-- Allow storytellers to update codex sections
-- Allow storytellers to delete codex sections

            ------- archive
            ------- CREATE POLICY "Allow owner to create codex sections" ON public.codex_sections FOR INSERT TO authenticated WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
            ------- CREATE POLICY "Allow owner to update codex sections" ON public.codex_sections FOR UPDATE TO authenticated USING ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))) WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
            ------- CREATE POLICY "Allow everyone to read public codex sections" ON public.codex_sections FOR SELECT USING ((hidden = false));
            ------- CREATE POLICY "Allow users to read codex sections, allow owner to read hidden" ON public.codex_sections FOR SELECT TO authenticated USING (((hidden = false) OR (game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));

-- Codex pages --

ALTER TABLE public.codex_pages ENABLE ROW LEVEL SECURITY; -- (0/6, 0/6)

-- Allow everyone to read public codex pages (game.open_codex)
-- Allow players of the game to read codex pages
-- Allow storytellers to read hidden codex pages
-- Allow storytellers to create codex pages
-- Allow storytellers to update codex pages
-- Allow storytellers to delete codex pages

            ------- archive
            ------- CREATE POLICY "Allow everyone to read public pages" ON public.codex_pages FOR SELECT USING ((hidden = false));
            ------- CREATE POLICY "Allow users to read pages, allow owner to read hidden" ON public.codex_pages FOR SELECT TO authenticated USING (((hidden = false) OR (game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));
            ------- CREATE POLICY "Allow owner to create codex pages" ON public.codex_pages FOR INSERT TO authenticated WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
            ------- CREATE POLICY "Allow owner to update pages" ON public.codex_pages FOR UPDATE TO authenticated USING ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))) WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));

-- Maps --

ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY; -- (0/6, 0/6)

-- Allow everyone to read maps in game.open_game
-- Allow players to read maps
-- Allow players to update maps
-- Allow storytellers to create maps
-- Allow storytellers to update maps
-- Allow storytellers to delete maps


-- WORKS --------------------------------------------


ALTER TABLE public.works ENABLE ROW LEVEL SECURITY; -- (0/4, 0/4)

-- Allow everyone to read works
-- Allow authenticated users to create works
-- Allow users to delete their own works
-- Allow users to update their own works


-- GENERAL --------------------------------------------


-- Threads --

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY; -- (0/2, 0/2)

-- Allow authenticated users to create threads
-- Allow users to delete their own threads

-- Posts --

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY; -- (0/9, 0/9)

-- Allow everyone to read posts in game.open_game and game.open_discussion
-- Allow everyone to read posts in boards and works
-- Allow players to read "public" posts
-- Allow players to read their "private" posts
-- Allow players to create posts
-- Allow players to delete their own posts
-- Allow players to update their own posts
-- Allow storytellers to delete all posts
-- Allow storytellers to update all posts

-- Messages --

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY; -- (0/4, 0/4)

-- Allow author and recipient to read their messages
-- Allow author to delete their messages
-- Allow author to update their messages
-- Allow recipient to update their messages (read)

-- User reads --

ALTER TABLE public.user_reads ENABLE ROW LEVEL SECURITY; -- (0/2, 0/2)

-- Allow authenticated users to read their own user_reads
-- Allow authenticated users to create user_reads
