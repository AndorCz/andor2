create or replace function public.get_character_names(audience_ids uuid[])
returns text[] as $$
declare
  names text[];
begin
  select array_agg(c.name) into names
  from unnest(audience_ids) as audience_id
  join public.characters c on c.id = audience_id;
  return names;
end;
$$ language plpgsql set search_path = '';
