create or replace function public.get_game_posts (thread_id integer, game_id integer, owners uuid[], _limit integer, _offset integer, _search text, _ascending boolean)
  returns json as $$
declare
  current_user_id uuid := auth.uid();
  is_storyteller boolean;
  player_characters uuid[];
  search_character_ids uuid[];
  search_lower text;
begin
  -- normalize the search term to lowercase, handling NULL cases
  search_lower := lower(coalesce(_search, ''));

  -- Resolve both pieces of player context with one indexed character lookup.
  select coalesce(bool_or(c.storyteller), false), array_agg(c.id)
  into is_storyteller, player_characters
  from public.characters c
  where c.game = game_id and c.player = current_user_id;

  -- Keep the overwhelmingly common non-search path free of text predicates and
  -- materialize only narrow identifiers before fetching the requested wide rows.
  if _search is null then
    return (
      with filtered_post_ids as materialized (
        select p.id, p.game_id, p.created_at
        from public.game_posts_owner p
        where p.thread = thread_id
        and (
          p.audience is null or is_storyteller or
          (not is_storyteller and (p.audience && player_characters or p.owner = any(player_characters)))
        )
        and (owners is null or p.owner = any(owners))
      ), paged_post_ids as (
        select fp.id, fp.game_id, fp.created_at
        from filtered_post_ids fp
        order by
          case when _ascending then fp.created_at end asc,
          case when _ascending then fp.id end asc,
          case when not _ascending then fp.created_at end desc,
          case when not _ascending then fp.id end desc
        limit _limit offset _offset
      ), paged_posts as (
        select
          p.*,
          c.name as owner_name,
          c.portrait as owner_portrait,
          fp.game_id,
          p.content as highlighted_content
        from paged_post_ids fp
        join public.posts p on p.id = fp.id
        left join public.characters c on c.id = p.owner
      )
      select json_build_object(
        'posts', (
          select coalesce(
            json_agg(
              (to_jsonb(pp) - 'content' || jsonb_build_object('content', pp.highlighted_content)) ||
              jsonb_build_object('audience_names', public.get_character_names(pp.audience))
              order by
                case when _ascending then pp.created_at end asc,
                case when _ascending then pp.id end asc,
                case when not _ascending then pp.created_at end desc,
                case when not _ascending then pp.id end desc
            ),
            '[]'::json
          )
          from paged_posts pp
        ),
        'count', (select count(*) from filtered_post_ids)
      )
    );
  end if;

  -- Resolve matching character names once. This is equivalent to checking the
  -- owner and every audience character name separately for every post.
  select coalesce(array_agg(c.id), '{}'::uuid[])
  into search_character_ids
  from public.characters c
  where lower(c.name) like '%' || search_lower || '%';

  return (
    with filtered_post_ids as materialized (
      select p.id, p.game_id, p.created_at
      from public.game_posts_owner p
      where p.thread = thread_id
      and (
        p.audience is null or is_storyteller or
        (not is_storyteller and (p.audience && player_characters or p.owner = any(player_characters)))
      )
      and (owners is null or p.owner = any(owners))
      and (
        lower(p.content) like '%' || search_lower || '%'
        or p.owner = any(search_character_ids)
        or p.audience && search_character_ids
      )
    ), paged_post_ids as (
      select fp.id, fp.game_id, fp.created_at
      from filtered_post_ids fp
      order by
        case when _ascending then fp.created_at end asc,
        case when _ascending then fp.id end asc,
        case when not _ascending then fp.created_at end desc,
        case when not _ascending then fp.id end desc
      limit _limit offset _offset
    ), paged_posts as (
      select
        p.*,
        c.name as owner_name,
        c.portrait as owner_portrait,
        fp.game_id,
        regexp_replace(p.content, '(?i)' || _search, '<span class="highlight">' || upper(_search) || '</span>', 'g') as highlighted_content
      from paged_post_ids fp
      join public.posts p on p.id = fp.id
      left join public.characters c on c.id = p.owner
    )
    select json_build_object(
      'posts', (
        select coalesce(
          json_agg(
            (to_jsonb(pp) - 'content' || jsonb_build_object('content', pp.highlighted_content)) ||
            jsonb_build_object('audience_names', public.get_character_names(pp.audience))
            order by
              case when _ascending then pp.created_at end asc,
              case when _ascending then pp.id end asc,
              case when not _ascending then pp.created_at end desc,
              case when not _ascending then pp.id end desc
          ),
          '[]'::json
        )
        from paged_posts pp
      ),
      'count', (select count(*) from filtered_post_ids)
    )
  );
end;
$$ language plpgsql set search_path = '';

create or replace function public.get_game_posts (thread_id integer, game_id integer, owners uuid[], _limit integer, _offset integer, _search text default null)
returns json as $$
  select public.get_game_posts(thread_id, game_id, owners, _limit, _offset, _search, false);
$$ language sql set search_path = '';
