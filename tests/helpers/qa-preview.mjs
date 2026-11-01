// Isolated local QA harness: real components/API handlers, in-memory PostgreSQL,
// synthetic Telegram authentication. Never loads .env.local or contacts Telegram.
import {createServer} from 'node:http';
import {createHmac,randomBytes,randomUUID} from 'node:crypto';
import {pendingMigrationFiles} from '../../src/server/db/migrations.mjs';
import net from 'node:net';
import {PGlite} from '@electric-sql/pglite';
import {downloadInvitation} from '../../src/server/pdf/http.mjs';
import {getRsvp,postRsvp} from '../../src/server/rsvp/http.mjs';
import {miniAppRequest} from '../../src/server/telegram/mini-app.mjs';
import {wishlistRequest,wishlistAdminRequest} from '../../src/server/wishlist/http.mjs';
import {seedWishlist} from './wishlist-fixtures.mjs';
import {seedInitialWishlist} from '../../src/server/wishlist/seed.mjs';
import {seedWishlistCatalogue} from '../../src/server/wishlist/catalog-seed.mjs';
import {saveRsvp} from '../../src/server/rsvp/repository.mjs';
import {validateRsvp} from '../../src/server/rsvp/validation.mjs';
import {transaction} from '../../src/server/db/index.mjs';
const port=Number(process.env.QA_PORT||3100),upstreamPort=Number(process.env.QA_UPSTREAM_PORT||3000);
if(!Number.isInteger(port)||!Number.isInteger(upstreamPort)||port<1024||port>65535||upstreamPort<1024||upstreamPort>65535)throw new Error('Invalid local QA ports');
const origin='http://localhost:'+port;process.env.PUBLIC_SITE_URL=origin;process.env.TELEGRAM_ALLOWED_USER_IDS='123';
const env={TELEGRAM_BOT_TOKEN:randomBytes(32).toString('hex'),TELEGRAM_ALLOWED_USER_IDS:'123'};
// Browser suites always use fresh memory DBs. The manual local preview can
// explicitly keep its own isolated on-disk database across restarts.
if(process.env.QA_INITIAL_WISHLIST==='1'&&port!==3100)throw new Error('Persistent manual catalogue preview is restricted to port 3100');
const db=new PGlite(process.env.QA_INITIAL_WISHLIST==='1'?'qa-artifacts/local-preview-db':undefined);
await db.exec('CREATE TABLE IF NOT EXISTS qa_schema_migrations(name text PRIMARY KEY,checksum text NOT NULL)');
for(const migration of pendingMigrationFiles()){
 const old=(await db.query('SELECT checksum FROM qa_schema_migrations WHERE name=$1',[migration.name])).rows[0];
 if(old){if(old.checksum!==migration.checksum)throw new Error('Local QA migration checksum changed');continue;}
 await db.exec('BEGIN');try{await db.exec(migration.sql);await db.query('INSERT INTO qa_schema_migrations(name,checksum) VALUES($1,$2)',[migration.name,migration.checksum]);await db.exec('COMMIT');}catch(error){await db.exec('ROLLBACK');throw error;}
}
let tail=Promise.resolve();const source={async connect(){const prior=tail;let unlock;tail=new Promise(resolve=>unlock=resolve);await prior;return {query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows};},release:unlock};}};
async function seed(client={query:(sql,args)=>db.query(sql,args)}){
const session='f'.repeat(64);await client.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[session]);
await saveRsvp(client,session,validateRsvp({guestName:'Ж'.repeat(77)+' 😀😀',attendance:'yes',returnTransfer:'needed',congratulationChoice:'public_with_someone',congratulationCompanion:'С'.repeat(120),hotAppetizer:'hot_meat',mainCourse:'main_fish',who:'Я'.repeat(120),food:'А'.repeat(300),musicRequest:'М'.repeat(300),transfer:'kupchino',venueRulesAccepted:true,dressCode:true,alcoholDrinks:['red_wine','white_wine','cognac','vodka','whisky','rum','gin','jagermeister','other'],alcoholOther:'С'.repeat(80),softDrinks:['cola','sprite','fanta','tonic','apple_juice','multifruit_juice','orange_juice','tomato_juice','sparkling_water','still_water','other'],softOther:'Б'.repeat(80)}),new Set());
}
if(!(await db.query('SELECT id FROM guest_sessions LIMIT 1')).rows.length)await seed();
if(process.env.QA_INITIAL_WISHLIST==='1'){await seedInitialWishlist(source);console.log('Local catalogue import',await seedWishlistCatalogue(source));}
function initData(){const data=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:123,first_name:'QA'})});const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();data.set('hash',createHmac('sha256',key).update([...data.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>k+'='+v).join('\n')).digest('hex'));return data.toString();}
let status=0,delay=0;
const server=createServer(async(req,res)=>{try{
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.writeHead(403);res.end();return;}
 const url=new URL(req.url,origin);
 if(url.pathname==='/qa/shutdown'&&req.method==='POST'&&process.env.QA_BROWSER==='1'&&port===3310){res.end('closing local fixture');setTimeout(()=>process.exit(0),100);return;}
 if(url.pathname==='/qa/health'){res.end('isolated-browser-fixture');return;}
 if(url.pathname==='/qa/wishlist-catalog'&&process.env.QA_BROWSER==='1'&&port===3310&&req.method==='POST'){
  await transaction(async client=>{await client.query('TRUNCATE wishlist_reservations,wishlist_links,wishlist_items,wishlist_sessions');await client.query('DELETE FROM app_seed_history WHERE key IN ($1,$2)',['wishlist-initial-v1','wishlist-catalog-v2']);await client.query('UPDATE wishlist_settings SET show_reserver_names=false WHERE id=1');},source);
  await seedInitialWishlist(source);const result=await seedWishlistCatalogue(source);res.setHeader('content-type','application/json');res.end(JSON.stringify(result));return;
 }
 if(url.pathname==='/qa/wishlist-fixtures'&&process.env.QA_BROWSER==='1'&&req.method==='POST'){await transaction(async client=>{await client.query('TRUNCATE wishlist_reservations,wishlist_links,wishlist_items,wishlist_sessions');await client.query('UPDATE wishlist_settings SET show_reserver_names=false WHERE id=1');await seedWishlist(client);},source);res.end('synthetic wishlist fixtures');return;}
 if(url.pathname==='/qa/reset'&&process.env.QA_BROWSER==='1'&&req.method==='POST'){await transaction(async client=>{await client.query('TRUNCATE guest_sessions CASCADE');await client.query('TRUNCATE rate_limits');await seed(client);},source);status=0;delay=0;res.end('reset synthetic fixtures');return;}
 if(url.pathname==='/qa/admin-fixtures'&&process.env.QA_BROWSER==='1'&&req.method==='POST'){
  await transaction(async client=>{
   await client.query('TRUNCATE guest_sessions CASCADE');const session='e'.repeat(64);
   await client.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[session]);
   let fixtureIndex=0;for(const input of [
    {guestName:'Сергей Иванов',who:'Друг Максима. За хороший плейлист.',transfer:'kupchino',musicRequest:'Queen — Don’t Stop Me Now\nABBA — Dancing Queen',food:'Аллергия на орехи',alcoholDrinks:['red_wine','whisky'],softDrinks:['cola','tonic']},
    {guestName:'Мария Петрова',hotAppetizer:'hot_fish',mainCourse:'main_meat',who:'Подруга Ани',transfer:'pavlovsk',musicRequest:'Земфира — Хочешь?',alcoholDrinks:['white_wine'],softDrinks:['orange_juice']},
    {guestName:'Александр Смирнов',who:'Брат',transfer:'self',food:'Без мяса',alcoholDrinks:['other'],alcoholOther:'Сидр',softDrinks:['other'],softOther:'Холодный чай'},
    {guestName:'Елена Соколова',attendance:'no'}
   ]){const saved=await saveRsvp(client,session,validateRsvp({attendance:'yes',returnTransfer:'needed',congratulationChoice:'public',venueRulesAccepted:true,dressCode:true,hotAppetizer:'hot_meat',mainCourse:'main_fish',...input,submissionKey:randomUUID()}),new Set());await client.query('UPDATE rsvps SET created_at=$2 WHERE id=$1',[saved.rsvp.id,new Date(Date.UTC(2026,0,++fixtureIndex))]);}
  },source);res.end('synthetic organizer fixtures');return;
 }
 if(url.pathname==='/qa/config'){status=Number(url.searchParams.get('status')||0);delay=Number(url.searchParams.get('delay')||0);res.end('configured');return;}
 if(url.pathname==='/qa/count'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify((await db.query('SELECT count(*)::int total FROM rsvps')).rows[0]));return;}
 if(url.pathname==='/qa-sdk.js'){res.setHeader('Content-Type','application/javascript');res.end('window.Telegram={WebApp:{initData:'+JSON.stringify(initData())+',ready(){},expand(){},safeAreaInset:{top:24,bottom:20},contentSafeAreaInset:{top:12,bottom:0}}};');return;}
 if(url.pathname.startsWith('/api/')){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);
  if(delay&&req.method==='POST')await new Promise(resolve=>setTimeout(resolve,delay));
  let reply;if(status&&req.method==='POST')reply=Response.json({error:'Technical details must never appear in UI'},{status});
  else {const request=new Request(url,{method:req.method,headers:req.headers,...(body.length?{body}:{})});reply=url.pathname==='/api/rsvp/invitation'?await downloadInvitation(request,source):url.pathname==='/api/rsvp'?(req.method==='GET'?await getRsvp(request,source):await postRsvp(request,source)):url.pathname==='/api/telegram/mini-app'?await miniAppRequest(request,{source,env}):url.pathname==='/api/wishlist'?await wishlistRequest(request,{source}):url.pathname==='/api/telegram/wishlist'?await wishlistAdminRequest(request,{source,env}):new Response(null,{status:404});}
  res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(Buffer.from(await reply.arrayBuffer()));return;
 }
 const upstream=await fetch(new URL(req.url,'http://127.0.0.1:'+upstreamPort),{headers:{'accept-encoding':'identity'}});
 let bytes=Buffer.from(await upstream.arrayBuffer());const headers=Object.fromEntries(upstream.headers);delete headers['content-encoding'];delete headers['content-length'];delete headers['transfer-encoding'];
 if(url.pathname.endsWith('.js'))bytes=Buffer.from(bytes.toString().replaceAll('https://telegram.org/js/telegram-web-app.js',origin+'/qa-sdk.js'));
 res.writeHead(upstream.status,headers);res.end(bytes);
 }catch{res.writeHead(503);res.end('Isolated QA unavailable');}});
server.on('upgrade',(req,socket,head)=>{if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){socket.destroy();return;}const upstream=net.connect(upstreamPort,'127.0.0.1',()=>{upstream.write(req.method+' '+req.url+' HTTP/1.1\r\n'+Object.entries(req.headers).map(([k,v])=>k+': '+v).join('\r\n')+'\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);});upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());});
server.listen(port,'::',()=>console.log('Isolated QA on '+origin+' (synthetic data only)'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await db.close();process.exit(0);}));
