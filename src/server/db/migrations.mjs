import fs from 'node:fs';
import crypto from 'node:crypto';
const migrationDirectory=new URL('../../../migrations/',import.meta.url);
export function pendingMigrationFiles(directory=migrationDirectory){
  return fs.readdirSync(directory).filter(name=>/^\d+.*\.sql$/.test(name)).sort().map(name=>{
    const sql=fs.readFileSync(new URL(name,directory),'utf8');
    return {name,sql,checksum:crypto.createHash('sha256').update(sql).digest('hex')};
  });
}
// Caller owns the transaction: lock, DDL and ledger are committed together.
export async function applyMigrations(client,migrations=pendingMigrationFiles()){
  await client.query('SELECT pg_advisory_xact_lock(17072027)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  const applied=[];
  for(const migration of migrations){
    const existing=await client.query('SELECT checksum FROM schema_migrations WHERE name=$1',[migration.name]);
    if(existing.rows.length){
      if(existing.rows[0].checksum!==migration.checksum)throw new Error('Migration changed');
      continue;
    }
    await client.query(migration.sql);
    await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[migration.name,migration.checksum]);
    applied.push(migration.name);
  }
  return applied;
}
