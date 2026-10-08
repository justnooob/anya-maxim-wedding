import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {safeDatabaseDiagnostic,checkDatabaseConnection} from '../src/server/db/diagnostics.mjs';
import {applyMigrations} from '../src/server/db/migrations.mjs';

test('diagnostics never echo raw messages, URLs, passwords or tokens',()=>{
  const secrets=[['postgresql:','//','user',':','password','@private/db'].join(''),'password','123456:telegram-token','guest-session-token'];
  for(const code of ['28P01','42P07','ECONNREFUSED',undefined]){
    const error={name:'Error',code,message:secrets.join(' '),detail:secrets.join(' '),stack:secrets.join(' ')};
    const output=JSON.stringify(safeDatabaseDiagnostic(error,{stage:'applying migration',filename:'003_drink_choices.sql'}));
    for(const secret of secrets)assert.ok(!output.includes(secret));
    assert.match(output,/003_drink_choices.sql/);
  }
  const output=JSON.stringify(safeDatabaseDiagnostic({name:secrets[0],code:secrets[1],message:secrets[2]},{stage:secrets[3],filename:secrets[0]}));
  for(const secret of secrets)assert.ok(!output.includes(secret));
  assert.equal(safeDatabaseDiagnostic({name:'error',code:'42501',message:'secret'}).name,'error');
  assert.equal(safeDatabaseDiagnostic({code:'42501'}).message,'Insufficient database privileges.');
});

test('connection probe runs SELECT 1 and propagates failure without logging credentials',async()=>{
  const queries=[];await checkDatabaseConnection({query:async sql=>{queries.push(sql);}});
  assert.deepEqual(queries,['SELECT 1']);
  await assert.rejects(checkDatabaseConnection({query:async()=>{throw Object.assign(new Error('secret'),{code:'ENOTFOUND'});}}),{code:'ENOTFOUND'});
});

test('migration error context identifies metadata, checksum and applying stages',async()=>{
  const file={name:'004_test.sql',sql:'SELECT 1',checksum:'new'};
  for(const scenario of ['metadata table','checksum','applying migration']){
    let context;
    const client={query:async(sql)=>{
      if(scenario==='metadata table'&&sql.startsWith('CREATE TABLE'))throw Object.assign(new Error('secret'),{code:'42501'});
      if(sql.startsWith('SELECT checksum'))return {rows:scenario==='checksum'?[{checksum:'old'}]:[]};
      if(scenario==='applying migration'&&sql===file.sql)throw Object.assign(new Error('secret'),{code:'42601'});
      return {rows:[]};
    }};
    await assert.rejects(applyMigrations(client,[file],next=>{context=next;}),error=>{
      const detail=safeDatabaseDiagnostic(error,context);
      assert.equal(detail.stage,scenario);
      if(scenario!=='metadata table')assert.equal(detail.filename,file.name);
      assert.ok(!detail.message.includes('secret'));return true;
    });
  }
});

test('migration CLI missing configuration fails safely before executing migrations',()=>{
  const env={...process.env};delete env.DATABASE_URL;
  const result=spawnSync(process.execPath,['scripts/migrate.mjs'],{env,encoding:'utf8'});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Database connection failed/);
  assert.match(result.stderr,/"stage":"connection"/);
  assert.doesNotMatch(result.stdout,/Applied migration|Database connection established/);
  assert.doesNotMatch(result.stderr,/postgresql:\/\//);
});
