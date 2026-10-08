import {database,transaction} from '../src/server/db/index.mjs';
import {applyMigrations} from '../src/server/db/migrations.mjs';
import {checkDatabaseConnection,safeDatabaseDiagnostic} from '../src/server/db/diagnostics.mjs';
let source;
let context={stage:'connection'};
try {
  source=database();
  await checkDatabaseConnection(source);
  console.log('Database connection established');
  const applied=await transaction(client=>applyMigrations(client,undefined,next=>{context=next;}),source);
  for(const name of applied)console.log('Applied migration: '+name);
  console.log('Migrations completed.');
} catch(error){
  const prefix=context.stage==='connection'?'Database connection failed':'Migration failed';
  console.error(prefix+': '+JSON.stringify(safeDatabaseDiagnostic(error,context)));
  process.exitCode=1;
}
finally {
  try{if(source)await source.end();}
  catch(error){console.error('Database close failed: '+JSON.stringify(safeDatabaseDiagnostic(error,{stage:'connection'})));process.exitCode=1;}
}
