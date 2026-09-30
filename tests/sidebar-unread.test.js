import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Run with SIDEBAR_TEST_PGLITE pointing to an installed @electric-sql/pglite module.
test('clearing sidebar sections preserves other users and sections and records read timestamps', { skip: !process.env.SIDEBAR_TEST_PGLITE }, async () => {
  const { PGlite } = await import(process.env.SIDEBAR_TEST_PGLITE)
  const db = new PGlite()
  const me = '00000000-0000-4000-8000-000000000001'
  const other = '00000000-0000-4000-8000-000000000002'
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      create table characters (id uuid primary key, player uuid);
      create table bookmarks (user_id uuid, game_main_thread int, game_discussion_thread int, board_thread int, work_thread int);
      create table unread_threads (user_id uuid, thread_id int, unread_count int, primary key (user_id, thread_id));
      create table read_threads (user_id uuid, thread_id int, read_at timestamptz, primary key (user_id, thread_id));
      create table unread_user_message_counts (recipient_user_id uuid, sender_user_id uuid, unread_count int, primary key (recipient_user_id, sender_user_id));
      create table read_user_conversations (reader_user_id uuid, peer_user_id uuid, read_at timestamptz, primary key (reader_user_id, peer_user_id));
      create table unread_character_message_counts (recipient_character_id uuid, sender_character_id uuid, unread_count int, primary key (recipient_character_id, sender_character_id));
      create table read_character_conversations (reader_character_id uuid, peer_character_id uuid, read_at timestamptz, primary key (reader_character_id, peer_character_id));
      grant select, insert, update on all tables in schema public to authenticated;
      insert into characters values ('${me}', '${me}'), ('${other}', '${other}');
      insert into bookmarks values ('${me}', 1, 2, 3, 4), ('${me}', 1, null, null, null), ('${other}', 5, null, null, null);
      insert into unread_threads values ('${me}', 1, 2), ('${me}', 2, 3), ('${me}', 3, 4), ('${me}', 4, 5), ('${me}', 5, 6), ('${other}', 1, 7);
      insert into read_threads values ('${me}', 1, '2000-01-01');
      insert into unread_user_message_counts values ('${me}', '${other}', 3), ('${other}', '${me}', 4);
      insert into unread_character_message_counts values ('${me}', '${other}', 5), ('${other}', '${me}', 6);
      insert into read_user_conversations values ('${me}', '${other}', '2000-01-01');
    `)
    const schema = await readFile(new URL('../src/db/schema.sql', import.meta.url), 'utf8')
    const definition = schema.match(/create or replace function public\.clear_sidebar_unread[\s\S]*?grant execute on function public\.clear_sidebar_unread\(text\) to authenticated;/)?.[0]
    assert.ok(definition, 'Sidebar function must be present in schema.sql')
    await db.exec(definition)
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [me])
    await db.exec('set role authenticated')
    const rows = async sql => (await db.query(sql)).rows
    const clear = async panel => db.query('select clear_sidebar_unread($1)', [panel])
    await assert.rejects(clear('invalid'), /Neznámá sekce/)
    await clear('booked')
    assert.deepEqual((await rows(`select unread_count from unread_threads where user_id = '${me}' order by thread_id`)).map(r => r.unread_count), [0, 0, 0, 0, 6])
    assert.equal((await rows(`select unread_count from unread_threads where user_id = '${other}'`))[0].unread_count, 7)
    assert.equal((await rows('select count(*)::int as count from read_threads where read_at > now() - interval \'1 minute\''))[0].count, 4)
    assert.deepEqual((await rows('select unread_count from unread_user_message_counts order by recipient_user_id')).map(r => r.unread_count), [3, 4])
    await clear('people')
    assert.deepEqual((await rows('select unread_count from unread_user_message_counts order by recipient_user_id')).map(r => r.unread_count), [0, 4])
    assert.equal((await rows('select read_at > now() - interval \'1 minute\' as recent from read_user_conversations'))[0].recent, true)
    assert.deepEqual((await rows('select unread_count from unread_character_message_counts order by recipient_character_id')).map(r => r.unread_count), [5, 6])
    await clear('characters')
    assert.deepEqual((await rows('select unread_count from unread_character_message_counts order by recipient_character_id')).map(r => r.unread_count), [0, 6])
    assert.equal((await rows('select reader_character_id from read_character_conversations'))[0].reader_character_id, me)
    await clear('characters')
    assert.equal((await rows('select count(*)::int as count from read_character_conversations'))[0].count, 1)
    // A later message becomes unread again and can be cleared on a subsequent click.
    await db.exec(`update unread_user_message_counts set unread_count = 1 where recipient_user_id = '${me}'`)
    assert.equal((await rows(`select unread_count from unread_user_message_counts where recipient_user_id = '${me}'`))[0].unread_count, 1)
    await clear('people')
    assert.equal((await rows(`select unread_count from unread_user_message_counts where recipient_user_id = '${me}'`))[0].unread_count, 0)
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
    await assert.rejects(clear('people'), /musíš přihlásit/)
    await db.exec('reset role; set role anon')
    await assert.rejects(clear('people'), /permission denied/)
  } finally { await db.close() }
})
