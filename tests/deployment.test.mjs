import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {applyMigrations,pendingMigrationFiles} from '../src/server/db/migrations.mjs';
import {registerWebhook} from '../src/server/telegram/register-webhook.mjs';
import {webhook} from '../src/server/telegram/webhook.mjs';

test('Amvera applies migrations at runtime only and local webhook loads ignored env file',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.equal(pkg.scripts['start:amvera'],'npm run db:migrate && next start --hostname 0.0.0.0');
  assert.equal(pkg.scripts.build,'next build');
  assert.equal(pkg.scripts['telegram:webhook'],'node --env-file=.env.local scripts/telegram-webhook.mjs');
  const config=fs.readFileSync('amvera.yml','utf8');
  assert.match(config,/command: npm run start:amvera/);assert.match(config,/containerPort: "3000"/);
  assert.doesNotMatch(config.slice(config.indexOf('build:'),config.indexOf('run:')),/migrat/);
});

test('migration runner preserves data on repeated start and rejects changed applied migrations',async()=>{
  const db=new PGlite();
  const client={query:async(sql,args)=>args?db.query(sql,args):(await db.exec(sql)).at(-1)};
  const run=async(files)=>{
    await db.exec('BEGIN');
    try{const result=await applyMigrations(client,files);await db.exec('COMMIT');return result;}
    catch(error){await db.exec('ROLLBACK');throw error;}
  };
  try{
    const files=pendingMigrationFiles();assert.equal((await run(files)).length,files.length);
    await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",['a'.repeat(64)]);
    await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance) VALUES($1,$2,'Сохранённый гость','no')",['00000000-0000-4000-8000-000000000001','a'.repeat(64)]);
    assert.deepEqual(await run(files),[]);
    assert.equal((await db.query('SELECT guest_name FROM rsvps')).rows[0].guest_name,'Сохранённый гость');
    assert.equal((await db.query('SELECT count(*)::int AS count FROM schema_migrations')).rows[0].count,files.length);
    await assert.rejects(run([{...files[0],checksum:'changed'}]),/Migration changed/);
    await assert.rejects(run([{name:'999_fail.sql',checksum:'test',sql:'CREATE TABLE rollback_probe(id int); SELECT nonexistent_column;'}]));
    assert.equal((await db.query("SELECT to_regclass('rollback_probe') AS table_name")).rows[0].table_name,null);
    assert.equal((await db.query("SELECT count(*)::int AS count FROM schema_migrations WHERE name='999_fail.sql'")).rows[0].count,0);
  }finally{await db.close();}
});

test('local webhook registration uses only Telegram and site configuration, without database',async()=>{
  const calls=[];
  const env={TELEGRAM_BOT_TOKEN:'test-token',TELEGRAM_WEBHOOK_SECRET:'s'.repeat(40),PUBLIC_SITE_URL:'https://anya-maxim-wedding-justnooob.amvera.io'};
  const createApi=token=>{assert.equal(token,env.TELEGRAM_BOT_TOKEN);return async(method,payload)=>{calls.push({method,payload});return {username:'amwed_bot'};};};
  await registerWebhook(env,createApi);
  assert.deepEqual(calls.map(call=>call.method),['getMe','setWebhook']);
  assert.equal(calls[1].payload.url,'https://anya-maxim-wedding-justnooob.amvera.io/api/telegram/webhook');
  assert.equal(calls[1].payload.secret_token,env.TELEGRAM_WEBHOOK_SECRET);
  assert.equal(calls[1].payload.drop_pending_updates,false);
  for(const values of [{PUBLIC_SITE_URL:'http://localhost:3000'},{TELEGRAM_WEBHOOK_SECRET:''},{PUBLIC_SITE_URL:'https://user:password@example.com'}]){
    await assert.rejects(registerWebhook({...env,...values},()=>{throw new Error('Should not call Telegram');}),/Configuration/);
  }
});

test('unsigned webhook requests are rejected before payload parsing or database access',async()=>{
  const saved=process.env.TELEGRAM_WEBHOOK_SECRET;
  process.env.TELEGRAM_WEBHOOK_SECRET='s'.repeat(40);
  try{
    for(const header of [undefined,'wrong']){
      const headers=header?{'x-telegram-bot-api-secret-token':header}:{};
      assert.equal((await webhook(new Request('https://example.com/api/telegram/webhook',{method:'POST',headers,body:'invalid json'}))).status,403);
    }
  }finally{if(saved===undefined)delete process.env.TELEGRAM_WEBHOOK_SECRET;else process.env.TELEGRAM_WEBHOOK_SECRET=saved;}
});
