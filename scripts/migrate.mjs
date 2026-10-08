import {database,transaction} from '../src/server/db/index.mjs';
import {applyMigrations} from '../src/server/db/migrations.mjs';
try {
  const applied=await transaction(client=>applyMigrations(client));
  for(const name of applied)console.log('Applied migration: '+name);
  console.log('Migrations completed.');
} catch {console.error('Migration failed. Check database configuration and migration checksums. Sensitive details hidden.');process.exitCode=1;}
finally {try{if(process.env.DATABASE_URL)await database().end();}catch{console.error('Database close failed. Details hidden.');process.exitCode=1;}}
