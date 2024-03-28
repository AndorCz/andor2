import dotenv from 'dotenv';
import { createHash } from 'crypto';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

dotenv.config();


const dbPath = process.env.SQLITE_PATH

async function queryDatabase(sqlQuery) {
  try {
    // Open the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // get data
    const row = await db.get(sqlQuery);
    
    // Close the database connection
    await db.close();
    return row

    } catch (err) {
        throw err;
    }
}


export async function getOldUserInfo(login, password) {
    const hashedPassword = createHash('md5').update(password).digest('hex');
    const sqlQuery = `SELECT old_id, old_login, old_email FROM old_users WHERE old_login = '${login}' AND old_psw = '${hashedPassword}'`;
    const results = await queryDatabase(sqlQuery);
    return results
}


// Testing lol
// getOldUserInfo('Avium','123')