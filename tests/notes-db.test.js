import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Optional isolated PostgreSQL integration test: set NOTES_TEST_PGLITE to an installed @electric-sql/pglite module path.
test('notes ownership, game assignment and revocable read-only sharing', { skip: !process.env.NOTES_TEST_PGLITE }, async () => {
  const { PGlite } = await import(process.env.NOTES_TEST_PGLITE)
  const db = new PGlite()
  const owner = '00000000-0000-4000-8000-000000000001'
  const other = '00000000-0000-4000-8000-000000000002'
  const note = '00000000-0000-4000-8000-000000000003'
  const token = '00000000-0000-4000-8000-000000000004'
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      create table public.profiles (id uuid primary key);
      create table public.games (id integer primary key, owner uuid);
      create table public.characters (game integer, player uuid, accepted boolean);
      grant select on public.games, public.characters to authenticated;
      insert into public.profiles values ('${owner}'), ('${other}');
      insert into public.games values (1, '${owner}'), (2, '${other}'), (3, '${other}');
      insert into public.characters values (3, '${owner}', true);
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/20260924202815_notes.sql', import.meta.url), 'utf8'))
    const login = async id => {
      await db.exec('reset role')
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id || ''])
      await db.exec(`set role ${id ? 'authenticated' : 'anon'}`)
    }
    const rows = async sql => (await db.query(sql)).rows
    await login(owner)
    await db.query('insert into notes(id, title, content) values ($1, $2, $3)', [note, 'Secret', '<p>Hello</p>'])
    assert.equal((await rows('select * from notes')).length, 1)
    await assert.rejects(db.query('insert into notes(owner) values ($1)', [other]), /row-level security/)
    await assert.rejects(db.query('update notes set owner = $1', [other]), /row-level security/)
    await db.exec('update notes set game = 1')
    await db.exec('update notes set game = 3')
    await assert.rejects(db.exec('update notes set game = 2'), /vlastní hře/)
    await db.query('update notes set share_token = $1', [token])
    await login(other)
    assert.equal((await rows('select * from notes')).length, 0)
    assert.equal((await rows("update notes set title = 'Hacked' returning id")).length, 0)
    assert.equal((await rows('delete from notes returning id')).length, 0)
    assert.equal((await db.query('select * from read_shared_note($1)', [token])).rows[0].title, 'Secret')
    await login(null)
    await assert.rejects(db.exec('select * from notes'), /permission denied/)
    await assert.rejects(db.exec("insert into notes(title) values ('Hacked')"), /permission denied/)
    const shared = (await db.query('select * from read_shared_note($1)', [token])).rows
    assert.deepEqual(Object.keys(shared[0]).sort(), ['content', 'title', 'updated_at'])
    assert.equal(shared[0].content, '<p>Hello</p>')
    assert.equal((await db.query('select * from read_shared_note($1)', [note])).rows.length, 0)
    assert.equal((await rows('select * from read_shared_note(null)')).length, 0)
    await login(owner)
    await db.exec('update notes set share_token = null')
    await login(null)
    assert.equal((await db.query('select * from read_shared_note($1)', [token])).rows.length, 0)
    await db.exec('reset role; delete from public.games where id = 3')
    await login(owner)
    assert.equal((await rows('select game from notes'))[0].game, null)
    await db.exec('delete from notes')
    assert.equal((await rows('select * from notes')).length, 0)
  } finally { await db.close() }
})
