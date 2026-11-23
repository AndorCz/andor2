create or replace function get_discussion_posts (_thread integer, page integer, _limit int, ascending boolean, _important_only boolean default false)
returns json as $$
declare
  postdata json;
  total_count int;
begin
  -- get the total count of matching records
  select count(*)
  into total_count
  from discussion_posts_owner po
  where po.thread = _thread and (not _important_only or po.important = true);

  -- get the paginated posts
  select json_agg(t)
  into postdata
  from (
    select po.*, get_character_names(po.audience) as audience_names
    from discussion_posts_owner po
    where po.thread = _thread and (not _important_only or po.important = true)
    order by
      case when ascending then po.created_at end asc,
      case when ascending then po.id end asc,
      case when not ascending then po.created_at end desc,
      case when not ascending then po.id end desc
    limit _limit
    offset page * _limit
  ) t;

  -- return the result as json
  return json_build_object(
    'count', total_count,
    'postdata', postdata
  );
end;
$$ language plpgsql;

create or replace function get_discussion_posts_special (user_id uuid, _thread integer, page integer, _limit int, ascending boolean)
returns json as $$
declare
  postdata json;
  total_count int;
begin
  -- get the total count of matching records
  select count(*)
  into total_count
  from discussion_posts_owner po
  where po.thread = _thread and (po.owner = user_id or user_id = any (po.audience));

  -- get the paginated posts
  select json_agg(t)
  into postdata
  from (
    select po.*, get_character_names(po.audience) as audience_names
    from discussion_posts_owner po
    where po.thread = _thread and (po.owner = user_id or user_id = any (po.audience))
    order by
      case when ascending then po.created_at end asc,
      case when ascending then po.id end asc,
      case when not ascending then po.created_at end desc,
      case when not ascending then po.id end desc
    limit _limit
    offset page * _limit
  ) t;

  -- return the result as json
  return json_build_object(
    'count', total_count,
    'postdata', postdata
  );
end;
$$ language plpgsql;

create or replace function get_discussion_posts_special (user_id uuid, _thread integer, page integer, _limit int)
returns json as $$
  select get_discussion_posts_special(user_id, _thread, page, _limit, false);
$$ language sql;
