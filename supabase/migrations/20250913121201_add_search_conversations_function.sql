create or replace function search_conversations (search_term text)
returns table (
  contact_type text,
  contact_id uuid,
  contact_name text,
  contact_portrait text,
  contact_reward_icon text,
  message_id integer,
  message_content text,
  message_created_at timestamptz,
  message_direction text
)
as $$
declare
  v_query text := coalesce(trim(search_term), '');
  v_tsquery tsquery;
begin
  if v_query = '' then
    return;
  end if;

  begin
    v_tsquery := websearch_to_tsquery('simple', v_query);
  exception when others then
    return;
  end;

  if v_tsquery is null then
    return;
  end if;

  return query
    with current_profile as (select auth.uid() as id)
    select *
    from (
      select
        'user'::text as contact_type,
        other.id as contact_id,
        other.name as contact_name,
        other.portrait as contact_portrait,
        other.reward_icon as contact_reward_icon,
        m.id as message_id,
        m.content as message_content,
        m.created_at as message_created_at,
        case when m.sender_user = cp.id then 'outgoing' else 'incoming' end as message_direction
      from messages m
      cross join current_profile cp
      join profiles other
        on other.id = case when m.sender_user = cp.id then m.recipient_user else m.sender_user end
      where (m.sender_user = cp.id or m.recipient_user = cp.id)
        and m.sender_character is null
        and m.recipient_character is null
        and to_tsvector('simple', coalesce(m.content, '')) @@ v_tsquery

      union all

      select
        'character'::text as contact_type,
        other_char.id as contact_id,
        other_char.name as contact_name,
        other_char.portrait as contact_portrait,
        null::text as contact_reward_icon,
        m.id as message_id,
        m.content as message_content,
        m.created_at as message_created_at,
        case when m.sender_character = owner_char.id then 'outgoing' else 'incoming' end as message_direction
      from current_profile cp
      join characters owner_char on owner_char.player = cp.id
      join messages m on m.sender_character = owner_char.id or m.recipient_character = owner_char.id
      join characters other_char on other_char.id = case when m.sender_character = owner_char.id then m.recipient_character else m.sender_character end
      where m.sender_character is not null
        and m.recipient_character is not null
        and to_tsvector('simple', coalesce(m.content, '')) @@ v_tsquery
    ) as combined
    order by message_created_at desc;
end;
$$ language plpgsql stable;
