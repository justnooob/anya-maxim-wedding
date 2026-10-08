import pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import * as schema from './schema.mjs';
if(typeof window!=='undefined') throw new Error('Server only');
let pool;
export function database() {
  if(!process.env.DATABASE_URL) throw new Error('Database configuration missing');
  if(!pool) {
    pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000,statement_timeout:10000});
    pool.on('error',()=>console.error('Database pool unavailable. Details hidden.'));
  }
  return pool;
}
export function orm(){return drizzle(database(),{schema});}
export async function transaction(work, source=database()) {
  const client=await source.connect();
  try {await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result;}
  catch(error){await client.query('ROLLBACK');throw error;}
  finally{client.release();}
}
