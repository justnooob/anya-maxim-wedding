import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {createHmac} from 'node:crypto';
import {adminAnalytics,guestQuery} from '../src/server/telegram/analytics.mjs';
import {miniAppRequest} from '../src/server/telegram/mini-app.mjs';
const env={TELEGRAM_BOT_TOKEN:['123456','synthetic'.repeat(4)].join(':'),TELEGRAM_ALLOWED_USER_IDS:'123'};
function signed(){const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:123})});const key=createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();p.set('hash',createHmac('sha256',key).update([...p.entries()].sort(([a],[b])=>a<b?-1:1).map(([k,v])=>k+'='+v).join('\n')).digest('hex'));return p.toString();}
const rows=[
 {id:'1',guest_name:'Сергей Иванов',attendance:'yes',who:'Друг',transfer:'kupchino',music_request:'ABBA\nQueen',food:'Без орехов',alcohol_drinks:['red_wine','other'],alcohol_other:'Сидр',soft_drinks:['tonic','other'],soft_other:'Чай'},
 {id:'2',guest_name:'Анна Петрова',attendance:'yes',who:'Сестра',transfer:'pavlovsk',music_request:'  ',food:'',alcohol_drinks:['red_wine','white_wine'],soft_drinks:['cola']},
 {id:'3',guest_name:'Борис Иванов',attendance:'yes',who:'Брат',transfer:'self',music_request:null,food:'Вегетарианец',alcohol_drinks:['none'],soft_drinks:['none']},
 {id:'4',guest_name:'Не придёт',attendance:'no',music_request:'irrelevant',food:'irrelevant',alcohol_drinks:['red_wine'],soft_drinks:[]},
];
test('analytics groups transfers, non-empty music/diet, distinct drink votes and custom choices',()=>{
 const a=adminAnalytics(rows);assert.deepEqual(a.transfers.kupchino.map(g=>g.name),['Сергей Иванов']);assert.deepEqual(a.transfers.pavlovsk.map(g=>g.name),['Анна Петрова']);assert.equal(a.transfers.unassigned.length,0);
 assert.equal(a.music.length,1);assert.equal(a.music[0].music,'ABBA\nQueen');assert.equal(a.diet.length,2);
 assert.equal(a.drinks.alcohol.find(d=>d.id==='red_wine').count,2);assert.equal(a.drinks.alcohol.find(d=>d.id==='none').count,1);
 assert.equal(a.drinks.soft.find(d=>d.id==='tonic').count,1);assert.deepEqual(a.custom.map(c=>c.text),['Сидр','Чай']);
 assert.ok(!JSON.stringify(a).includes('session_id'));
});
test('query validates options and binds search/combined filters rather than injecting SQL',()=>{
 const q=guestQuery(new URLSearchParams({filter:'yes',search:"%' OR true--",sort:'az',transfer:'kupchino',music:'yes',diet:'yes',alcohol:'red_wine',soft:'tonic'}));
 assert.ok(!q.sql.includes("OR true"));assert.ok(q.args.includes("%' OR true--"));assert.match(q.sql,/music_request/);assert.match(q.sql,/food/);
 for(const params of [{sort:'unsafe'},{transfer:'unsafe'},{music:'maybe'},{diet:'maybe'},{soft:'unsafe'},{offset:'-1'},{search:'x'.repeat(81)}])assert.throws(()=>guestQuery(new URLSearchParams(params)));
});
test('protected analytics endpoint, search, all sorts, combined filters and deletion refresh',async()=>{
 const db=new PGlite();const source={async connect(){return {query:(sql,args)=>db.query(sql,args),release(){}};}};
 const request=(path='',body)=>new Request('https://example.test/api/telegram/mini-app'+path,{method:body?'POST':'GET',headers:{'x-telegram-init-data':signed(),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const get=async(path='')=>{const res=await miniAppRequest(request(path),{env,source});assert.equal(res.status,200);return res.json();};
 try{
  await db.exec(fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
  const sid='a'.repeat(64);await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[sid]);
  for(const [i,row] of rows.slice(0,3).entries())await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,food,transfer,dress_code,alcohol_drinks,alcohol_other,soft_drinks,soft_other,music_request,created_at) VALUES($1,$2,$3,'yes',$4,$5,$6,true,$7,$8,$9,$10,$11,$12)",['00000000-0000-4000-8000-00000000000'+(i+1),sid,row.guest_name,row.who,row.food,row.transfer,row.alcohol_drinks,row.alcohol_other||'',row.soft_drinks,row.soft_other||'',row.music_request,new Date(2026,0,i+1)]);
  const all=await get();assert.equal(all.stats.total,3);assert.equal(all.stats.music,1);assert.equal(all.stats.diet,2);assert.equal(all.stats.kupchino,1);assert.equal(all.stats.pavlovsk,1);
  assert.deepEqual((await get('?sort=az')).guests.map(g=>g.name),['Анна Петрова','Борис Иванов','Сергей Иванов']);assert.equal((await get('?sort=za')).guests[0].name,'Сергей Иванов');assert.equal((await get('?sort=newest')).guests[0].name,'Борис Иванов');assert.equal((await get('?sort=oldest')).guests[0].name,'Сергей Иванов');
  assert.equal((await get('?search=иванов')).guests.length,2);assert.equal((await get('?search=%25')).guests.length,0);
  const combined=await get('?filter=yes&transfer=kupchino&music=yes&diet=yes&alcohol=red_wine&soft=tonic');assert.equal(combined.guests.length,1);
  assert.equal((await get('?music=no')).guests.length,2);assert.equal((await get('?diet=no')).guests.length,1);
  assert.equal((await get('?action=analytics')).custom.length,2);
  const id=combined.guests[0].id;const confirm=await (await miniAppRequest(request('',{action:'delete',id}),{env,source})).json();await miniAppRequest(request('',{action:'confirm',token:confirm.confirmation}),{env,source});
  const after=await get();assert.equal(after.stats.total,2);assert.equal(after.stats.music,0);assert.equal(after.stats.diet,1);assert.equal(after.stats.transfer,1);assert.equal(after.stats.kupchino,0);
  const a=await get('?action=analytics');assert.equal(a.music.length,0);assert.equal(a.custom.length,0);assert.equal(a.transfers.kupchino.length,0);assert.equal(a.drinks.alcohol.find(d=>d.id==='red_wine').count,1);
  const denied=await miniAppRequest(new Request('https://example.test/api/telegram/mini-app?action=analytics'),{env,source:{connect(){assert.fail('Unauthorized analytics cannot query DB');}}});assert.equal(denied.status,403);
 }finally{await db.close();}
});
