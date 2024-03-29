
import { createHash } from 'node:crypto'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

const dbPath = import.meta.env.SQLITE_PATH

async function queryDatabase (sqlQuery) {
  const db = await open({ filename: dbPath, driver: sqlite3.Database })
  const row = await db.get(sqlQuery)
  await db.close()
  return row
}

export async function getOldUserInfo (login, password) {
  const hashedPassword = createHash('md5').update(password).digest('hex')
  const sqlQuery = `SELECT old_id, old_login, old_email FROM old_users WHERE old_login = '${login}' AND old_psw = '${hashedPassword}'`
  const results = await queryDatabase(sqlQuery)
  return results
}

export async function getOldUserLogin (id) {
  const sqlQuery = `SELECT old_login FROM old_users WHERE old_id = '${id}'`
  const results = await queryDatabase(sqlQuery)
  return results
}

// Testing
// getOldUserInfo('Avium','123')
