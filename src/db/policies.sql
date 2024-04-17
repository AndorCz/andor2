

-- USER --------------------------------------------


-- Bookmarks --

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to add their own bookmarks + game joining" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR (game_id IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));


-- BOARDS --------------------------------------------


ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow delete for owner" ON public.boards FOR DELETE TO authenticated USING ((owner = auth.uid()));
CREATE POLICY "Allow update for owner" ON public.boards FOR UPDATE TO authenticated USING ((owner = auth.uid())) WITH CHECK ((owner = auth.uid()));
CREATE POLICY "Allow users to create their own characters" ON public.characters FOR INSERT TO authenticated WITH CHECK ((player = auth.uid()));
CREATE POLICY "Allow users to delete their own bookmarks" ON public.bookmarks FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Allow users to delete their own characters" ON public.characters FOR DELETE TO authenticated USING ((player = auth.uid()));
CREATE POLICY "Allow users to edit their own characters" ON public.characters FOR UPDATE TO authenticated USING ((player = auth.uid())) WITH CHECK ((player = auth.uid()));
CREATE POLICY "Allow users to only read their own bookmarks + game joining" ON public.bookmarks FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (game_id IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));
CREATE POLICY "Allow users to read codex sections, allow owner to read hidden" ON public.codex_sections FOR SELECT TO authenticated USING (((hidden = false) OR (game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));
CREATE POLICY "Allow users to read pages, allow owner to read hidden" ON public.codex_pages FOR SELECT TO authenticated USING (((hidden = false) OR (game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))));
CREATE POLICY "Allow users to see characters" ON public.characters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.boards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable read access to all users" ON public.boards FOR SELECT USING (true);


-- GAMES --------------------------------------------


-- Characters --

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accept character to game" ON public.characters FOR UPDATE USING (((game = ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))) AND (accepted = false))) WITH CHECK ((game = ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
CREATE POLICY "Allow everyone to see characters" ON public.characters FOR SELECT TO anon USING (true);

-- Codex --

ALTER TABLE public.codex_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow everyone to read public codex sections" ON public.codex_sections FOR SELECT USING ((hidden = false));
CREATE POLICY "Allow everyone to read public pages" ON public.codex_pages FOR SELECT USING ((hidden = false));
CREATE POLICY "Allow owner to create codex pages" ON public.codex_pages FOR INSERT TO authenticated WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
CREATE POLICY "Allow owner to create codex sections" ON public.codex_sections FOR INSERT TO authenticated WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
CREATE POLICY "Allow owner to update codex sections" ON public.codex_sections FOR UPDATE TO authenticated USING ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))) WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
CREATE POLICY "Allow owner to update pages" ON public.codex_pages FOR UPDATE TO authenticated USING ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid())))) WITH CHECK ((game IN ( SELECT games.id FROM public.games WHERE (games.owner = auth.uid()))));
