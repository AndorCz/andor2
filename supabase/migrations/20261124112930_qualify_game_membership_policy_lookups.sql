create or replace function public.is_player(game_id integer)
returns boolean as $$
begin
  return exists(select 1 from public.characters where game = game_id and accepted = true and player = auth.uid());
end;
$$ language plpgsql security definer set search_path = '';

create or replace function public.is_storyteller(game_id integer)
returns boolean as $$
begin
  return exists(select 1 from public.characters where game = game_id and accepted = true and player = auth.uid() and storyteller);
end;
$$ language plpgsql security definer set search_path = '';
