create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  game integer references public.games(id) on delete set null,
  title text not null default 'Nová poznámka' check (char_length(title) <= 200),
  content text not null default '' check (octet_length(content) <= 1000000),
  share_token uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_owner_updated_idx on public.notes(owner, updated_at desc);
create index notes_game_idx on public.notes(game);
alter table public.notes enable row level security;
revoke all on public.notes from anon, authenticated;
grant select, insert, update, delete on public.notes to authenticated;
create policy "Owners read notes" on public.notes for select to authenticated using (owner = (select auth.uid()));
create policy "Owners create notes" on public.notes for insert to authenticated with check (owner = (select auth.uid()));
create policy "Owners update notes" on public.notes for update to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "Owners delete notes" on public.notes for delete to authenticated using (owner = (select auth.uid()));

create or replace function public.validate_note() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.game is not null and (tg_op = 'INSERT' or new.game is distinct from old.game) then
    if not exists (select 1 from public.games where id = new.game and owner = auth.uid()) and not exists (select 1 from public.characters where game = new.game and player = auth.uid() and accepted) then
      raise exception 'Poznámku lze přiřadit pouze k vlastní hře' using errcode = '42501';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger validate_note before insert or update on public.notes for each row execute function public.validate_note();

-- A random, revocable token grants read access to exactly one note, never to the notebook.
create schema if not exists private;
create or replace function private.read_shared_note(token uuid) returns table(title text, content text, updated_at timestamptz) language sql stable security definer set search_path = '' as $$
  select n.title, n.content, n.updated_at from public.notes n where n.share_token = token;
$$;
revoke all on function private.read_shared_note(uuid) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.read_shared_note(uuid) to anon, authenticated;
create or replace function public.read_shared_note(token uuid) returns table(title text, content text, updated_at timestamptz) language sql stable security invoker set search_path = '' as $$
  select * from private.read_shared_note(token);
$$;
revoke all on function public.read_shared_note(uuid) from public;
grant execute on function public.read_shared_note(uuid) to anon, authenticated;
