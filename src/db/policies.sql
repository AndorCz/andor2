

-- USER --------------------------------------------


-- Profiles --

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; -- (Written 3/3, Tested+Published 0/3)

CREATE POLICY "Allow everyone to read profiles" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO public USING (TRUE)
CREATE POLICY "Allow users to change their profiles" ON "public"."profiles" AS PERMISSIVE FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())
CREATE POLICY "Allow users to delete their profiles" ON "public"."profiles" AS PERMISSIVE FOR DELETE TO authenticated USING (id = auth.uid())


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

CREATE POLICY "Allow everyone to read list of games" ON "public"."games" AS PERMISSIVE FOR SELECT TO public USING (TRUE)
CREATE POLICY "Allow users to create games" ON "public"."games" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (owner = auth.uid())
CREATE POLICY "Allow users to delete their own games" ON "public"."games" AS PERMISSIVE FOR DELETE TO authenticated USING (owner = auth.uid())
CREATE POLICY "Allow users to update their own games" ON "public"."games" AS PERMISSIVE FOR UPDATE TO authenticated USING (owner = auth.uid()) WITH CHECK (owner = auth.uid())

-- Characters --

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY; -- (5/6, 0/6)

CREATE POLICY "Allow everyone to read characters in game.open_game" ON "public"."characters" AS PERMISSIVE FOR SELECT TO public USING (game in (select id from games where open_game = true))
-- Allow players to read characters
-- CREATE POLICY "Allow players to read characters" ON "public"."characters" AS PERMISSIVE FOR SELECT TO authenticated USING (game in (select id from games where id in (select game from characters where player = auth.uid())))
-- Zakomentováno, docházelo k rekurzi.
CREATE POLICY "Allow players to create characters" ON public.characters FOR INSERT TO authenticated WITH CHECK ((player = auth.uid()));
CREATE POLICY "Allow players to delete their own characters" ON public.characters FOR DELETE TO authenticated USING ((player = auth.uid()));
CREATE POLICY "Allow users to update their own characters" ON public.characters FOR UPDATE TO authenticated USING ((player = auth.uid())) WITH CHECK ((player = auth.uid()));
CREATE POLICY "Allow storytellers to update all characters" ON "public"."characters" AS PERMISSIVE FOR UPDATE TO authenticated USING (game in (select id from games where owner = auth.uid())) WITH CHECK (game in (select id from games where owner = auth.uid()))

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

ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY; -- (5/6, 0/6)

CREATE POLICY "Allow everyone to read maps in game.open_game" ON "public"."maps" AS PERMISSIVE FOR SELECT TO public USING (game in (select id from games where open_game = true))
CREATE POLICY "Allow players to read maps" ON "public"."maps" AS PERMISSIVE FOR SELECT TO authenticated USING (game in (select game from characters where player = auth.uid()))
-- U update je otazka, jestli hlidat zda uzivatel nemeni vlastnosti, ktere by nemel.
-- Allow players to update maps
CREATE POLICY "Allow storytellers to create maps" ON "public"."maps" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (game in (select id from games where owner = auth.uid()))
CREATE POLICY "Allow storytellers to update maps" ON "public"."maps" AS PERMISSIVE FOR UPDATE TO authenticated USING (game in (select id from games where owner = auth.uid())) WITH CHECK (game in (select id from games where owner = auth.uid()))
CREATE POLICY "Allow storytellers to delete maps" ON "public"."maps" AS PERMISSIVE FOR DELETE TO authenticated USING (game in (select id from games where owner = auth.uid()))


-- WORKS --------------------------------------------


ALTER TABLE public.works ENABLE ROW LEVEL SECURITY; -- (4/4, 0/4)

CREATE POLICY "Allow everyone to read works" ON "public"."works" AS PERMISSIVE FOR SELECT TO public USING (TRUE)
CREATE POLICY "Allow users to create works" ON "public"."works" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (owner = auth.uid())
CREATE POLICY "Allow users to delete their own works" ON "public"."works" AS PERMISSIVE FOR DELETE TO authenticated USING (owner = auth.uid())
CREATE POLICY "Allow users to update their own works" ON "public"."works" AS PERMISSIVE FOR UPDATE TO authenticated USING (owner = auth.uid()) WITH CHECK (owner = auth.uid())


-- GENERAL --------------------------------------------


-- Threads --

ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY; -- (3/3, 0/2)

-- Bez tohoto pravidla nelze vytvaret zadne diskuze
CREATE POLICY "Allow everyone to read threads" ON "public"."threads" AS PERMISSIVE FOR SELECT TO public USING (TRUE)

CREATE POLICY "Allow authenticated users to create threads" ON "public"."threads" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (TRUE)
CREATE POLICY "Allow users to delete their own threads" ON "public"."threads" AS PERMISSIVE FOR DELETE TO authenticated
USING ((id in (select thread from boards where owner = auth.uid())) 
            or (id in (select discussion_thread from games where owner = auth.uid())) 
            or (id in (select game_thread from games where owner = auth.uid())) 
            or (id in (select thread from works where owner = auth.uid())))

-- Posts --

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY; -- (7/9, 0/9)

CREATE POLICY "Allow everyone to read posts in open_game and open_discussion" ON "public"."posts" AS PERMISSIVE FOR SELECT TO public
USING ((thread in (select discussion_thread from games where open_discussion = true)) 
            or (thread in (select game_thread from games where open_game = true)))
CREATE POLICY "Allow everyone to read posts in boards and works" ON "public"."posts" AS PERMISSIVE FOR SELECT TO public 
USING ((thread in (select thread from boards)) 
            or (thread in (select thread from works)))
-- Allow players to read "public" posts            -- toto pravidlo se mi zda duplicitni s predchozima dvema
-- Allow players to read their "private" posts     -- zde jsem narazil problem s parsovanim UID z pole audience
CREATE POLICY "Allow players to create posts" ON "public"."posts" AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK ((owner = auth.uid())
            AND thread in ( 
            select thread from boards 
            union
            select thread from works 
            union
            select discussion_thread as thread from games where games.id in (select game from characters where player = auth.uid()) 
            union
            select game_thread as thread from games where games.id in (select game from characters where player = auth.uid())
            ))
CREATE POLICY "Allow players to delete their own posts" ON "public"."posts" AS PERMISSIVE FOR DELETE TO authenticated USING (owner = auth.uid())
-- U update je otazka, jestli hlidat zda uzivatel nemeni thread do ktereho postuje. Aby neposilal prispevky kam nema.
CREATE POLICY "Allow players to update their own posts" ON "public"."posts" AS PERMISSIVE FOR UPDATE TO authenticated USING (owner = auth.uid()) WITH CHECK (owner = auth.uid())
CREATE POLICY "Allow storytellers to delete all posts" ON "public"."posts" AS PERMISSIVE FOR DELETE TO authenticated
            USING ((owner = auth.uid())
            OR (thread in (
            select discussion_thread as thread from games where owner = auth.uid() 
            union
            select game_thread as thread from games where owner = auth.uid()
            )))
CREATE POLICY "Allow storytellers to update all posts" ON "public"."posts" AS PERMISSIVE FOR UPDATE TO authenticated
USING (((owner = auth.uid()) OR (thread IN ( SELECT games.discussion_thread AS thread FROM games WHERE (games.owner = auth.uid()) UNION SELECT games.game_thread AS thread FROM games WHERE (games.owner = auth.uid())))))
WITH CHECK (((owner = auth.uid()) OR (thread IN ( SELECT games.discussion_thread AS thread FROM games WHERE (games.owner = auth.uid()) UNION SELECT games.game_thread AS thread FROM games WHERE (games.owner = auth.uid())))))

-- Messages --

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY; -- (5/5, 0/4)

CREATE POLICY "Allow author and recipient to read their messages" ON "public"."messages" AS PERMISSIVE FOR SELECT TO authenticated USING ((sender_user = auth.uid()) or (recipient_user = auth.uid()))
CREATE POLICY "Allow author to delete their messages" ON "public"."messages" AS PERMISSIVE FOR DELETE TO authenticated USING (sender_user = auth.uid())
-- U update bych se bal toho, ze uzivatel zmeni recipienta na nekoho jineho. Toto budeme muset nejak vyresit.
CREATE POLICY "Allow author to update their messages" ON "public"."messages" AS PERMISSIVE FOR UPDATE TO authenticated USING (sender_user = auth.uid()) WITH CHECK (sender_user = auth.uid())
CREATE POLICY "Allow recipient to update their messages (read)" ON "public"."messages" AS PERMISSIVE FOR UPDATE TO authenticated USING (recipient_user = auth.uid()) WITH CHECK (recipient_user = auth.uid())
-- Pridan insert, bez insertu neni mozne zpravy odeslat.
CREATE POLICY "Allow author to create messages" ON "public"."messages" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (sender_user = auth.uid())

-- User reads --

ALTER TABLE public.user_reads ENABLE ROW LEVEL SECURITY; -- (3/3, 0/2)

CREATE POLICY "Allow authenticated users to read their own user_reads" ON "public"."user_reads" AS PERMISSIVE FOR SELECT TO authenticated USING (user_id = auth.uid())
CREATE POLICY "Allow authenticated users to create user_reads" ON "public"."user_reads" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())
CREATE POLICY "Allow authenticated users to update their user_reads" ON "public"."user_reads" AS PERMISSIVE FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())
