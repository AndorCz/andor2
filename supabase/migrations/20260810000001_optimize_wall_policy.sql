begin;

do $$
declare
  existing_qual text;
begin
  if exists (
    select 1
    from pg_policy
    where polrelid = 'public.posts'::regclass
      and polname = 'READ posts used by wall'
  ) then
    select pg_get_expr(policy.polqual, policy.polrelid)
    into existing_qual
    from pg_policy policy
    where policy.polrelid = 'public.posts'::regclass
      and policy.polname = 'posts_select_policy';

    if existing_qual is null then raise exception 'Policy posts_select_policy neexistuje'; end if;
    execute format(
      'alter policy posts_select_policy on public.posts using ((%s) or exists (select 1 from public.wall where posts.id = any(wall.post) and (wall.published = true or public.is_admin())))',
      existing_qual
    );
    drop policy "READ posts used by wall" on public.posts;
  end if;
end;
$$;

create index if not exists idx_wall_owner on public.wall (owner);

commit;
