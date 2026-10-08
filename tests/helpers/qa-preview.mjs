// Isolated local QA harness: real components/API handlers, in-memory PostgreSQL,
// synthetic Telegram authentication. Never loads .env.local or contacts Telegram.
import {createServer} from 'node:http';
import {createHmac,randomBytes} from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import {PGlite} from '@electric-sql/pglite';
import {getRsvp,postRsvp} from '../../src/server/rsvp/http.mjs';
import {miniAppRequest} from '../../src/server/telegram/mini-app.mjs';
import {saveRsvp} from '../../src/server/rsvp/repository.mjs';
import {validateRsvp} from '../../src/server/rsvp/validation.mjs';
const origin='http://localhost:3100';process.env.PUBLIC_SITE_URL=origin;process.env.TELEGRAM_ALLOWED_USER_IDS='123';
const env={TELEGRAM_BOT_TOKEN:randomBytes(32).toString('hex'),TELEGRAM_ALLOWED_USER_IDS:'123'};
const db=new PGlite();await db.exec(fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
let tail=Promise.resolve();const source={async connect(){const prior=tail;let unlock;tail=new Promise(resolve=>unlock=resolve);await prior;return {query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows};},release:unlock};}};
const session='f'.repeat(64);await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[session]);
await saveRsvp({query:(sql,args)=>db.query(sql,args)},session,validateRsvp({guestName:'Ж'.repeat(78)+'😀😀',attendance:'yes',who:'Я'.repeat(120),food:'А'.repeat(300),musicRequest:'М'.repeat(300),transfer:'needed',overnight:'stay',dressCode:true,alcoholDrinks:['red_wine','white_wine','cognac','vodka','whisky','rum','gin','jagermeister','other'],alcoholOther:'С'.repeat(80),softDrinks:['cola','sprite','fanta','tonic','apple_juice','multifruit_juice','orange_juice','tomato_juice','sparkling_water','still_water','other'],softOther:'Б'.repeat(80)}),new Set());
function initData(){const data=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:123,first_name:'QA'})});const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();data.set('hash',createHmac('sha256',key).update([...data.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>k+'='+v).join('\n')).digest('hex'));return data.toString();}
let status=0,delay=0;
const server=createServer(async(req,res)=>{try{
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.writeHead(403);res.end();return;}
 const url=new URL(req.url,origin);
 if(url.pathname==='/qa/config'){status=Number(url.searchParams.get('status')||0);delay=Number(url.searchParams.get('delay')||0);res.end('configured');return;}
 if(url.pathname==='/qa/count'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify((await db.query('SELECT count(*)::int total FROM rsvps')).rows[0]));return;}
 if(url.pathname==='/qa-sdk.js'){res.setHeader('Content-Type','application/javascript');res.end('window.Telegram={WebApp:{initData:'+JSON.stringify(initData())+',ready(){},expand(){},safeAreaInset:{top:24,bottom:20},contentSafeAreaInset:{top:12,bottom:0}}};');return;}
 if(url.pathname.startsWith('/api/')){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);
  if(delay&&req.method==='POST')await new Promise(resolve=>setTimeout(resolve,delay));
  let reply;if(status&&req.method==='POST')reply=Response.json({error:'Technical details must never appear in UI'},{status});
  else {const request=new Request(url,{method:req.method,headers:req.headers,...(body.length?{body}:{})});reply=url.pathname==='/api/rsvp'?(req.method==='GET'?await getRsvp(request,source):await postRsvp(request,source)):url.pathname==='/api/telegram/mini-app'?await miniAppRequest(request,{source,env}):new Response(null,{status:404});}
  res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(Buffer.from(await reply.arrayBuffer()));return;
 }
 const upstream=await fetch(new URL(req.url,'http://localhost:3000'),{headers:{'accept-encoding':'identity'}});
 let bytes=Buffer.from(await upstream.arrayBuffer());const headers=Object.fromEntries(upstream.headers);delete headers['content-encoding'];delete headers['content-length'];delete headers['transfer-encoding'];
 if(url.pathname.endsWith('.js'))bytes=Buffer.from(bytes.toString().replaceAll('https://telegram.org/js/telegram-web-app.js',origin+'/qa-sdk.js'));
 res.writeHead(upstream.status,headers);res.end(bytes);
 }catch{res.writeHead(503);res.end('Isolated QA unavailable');}});
server.on('upgrade',(req,socket,head)=>{if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){socket.destroy();return;}const upstream=net.connect(3000,'127.0.0.1',()=>{upstream.write(req.method+' '+req.url+' HTTP/1.1\r\n'+Object.entries(req.headers).map(([k,v])=>k+': '+v).join('\r\n')+'\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);});upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());});
server.listen(3100,'::',()=>console.log('Isolated QA on http://localhost:3100 (synthetic data only)'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await db.close();process.exit(0);}));
