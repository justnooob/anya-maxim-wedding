import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {PGlite} from '@electric-sql/pglite';
import {renderTicket} from '../src/server/pdf/ticket.mjs';
import {ticketGuest} from '../src/server/pdf/ticket-model.mjs';
import {downloadInvitation} from '../src/server/pdf/http.mjs';
import {getRsvp,postRsvp} from '../src/server/rsvp/http.mjs';
import {cookieName} from '../src/server/rsvp/session.mjs';
import {sampleGuest,sampleFamily,longSample} from '../scripts/pdf-examples.mjs';
import {paginateTicketBlocks} from '../src/server/pdf/pagination.mjs';
import {mainCourseOptions} from '../src/content/menu.mjs';
import {event,calendarIcs} from '../src/content/calendar-event.mjs';
import {PUBLIC_ORIGIN,wedding,ANYA_TELEGRAM_URL,MAXIM_TELEGRAM_URL} from '../src/content/wedding.mjs';
async function parse(bytes){const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:false,isEvalSupported:false});const doc=await task.promise;const pages=[];for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);pages.push({text:(await p.getTextContent()).items.map(item=>item.str||'').join(' '),links:(await p.getAnnotations()).filter(a=>a.subtype==='Link').map(a=>a.url),page:p});}return {doc,pages,destroy:()=>task.destroy()};}
test('pagination uses the exact remaining area, excludes trailing gaps and moves whole blocks only',()=>{
 const a={id:'a',height:300,after:24},b={id:'b',height:250,after:200},c={id:'c',height:90,after:0};
 const pages=paginateTicketBlocks([a,b,c],{firstTop:100,continuationTop:82,bottom:700});
 assert.deepEqual(pages.map(p=>p.map(item=>item.block.id)),[['a','b'],['c']]);
 assert.equal(pages[0][1].top,424); // fits including preceding gap; trailing 200 is irrelevant
 assert.equal(pages[1][0].top,82); // no carried gap on a new page
 assert.equal(paginateTicketBlocks([{height:600,after:100}],{firstTop:100,bottom:700}).length,1);
 assert.throws(()=>paginateTicketBlocks([{height:701}],{firstTop:82,bottom:700}),/exceeds/);
});
test('all six real layouts are ordered and never move a block that fits the previous page',async()=>{
 for(const rows of [...[1,2,3,4,5].map(n=>sampleFamily.slice(0,n)),longSample]){
  let layout;await renderTicket(rows,{onLayout:value=>{layout=value;}});
  for(let i=0;i<layout.blocks.length;i++){
   const current=layout.blocks[i],previous=layout.blocks[i-1];
   assert.ok(current.top+current.height<=layout.bottom+.01,'whole block within printable region');
   if(previous&&current.page===previous.page)assert.ok(current.top>=previous.top+previous.height+previous.after-.01,'measured blocks do not overlap');
   if(previous&&current.page>previous.page)assert.ok(previous.top+previous.height+previous.after+current.height>layout.bottom,'page break only when the next complete block cannot fit');
   if(!previous&&current.page>1)assert.ok(layout.firstTop+current.height>layout.bottom,'first card moves only when it cannot fit under names');
  }
 }
});
test('long cover names switch to one column without shrinking; short names keep two columns',async()=>{
 let layout;await renderTicket(longSample,{onLayout:value=>{layout=value;}});assert.equal(layout.coverColumns,1);
 await renderTicket(sampleFamily,{onLayout:value=>{layout=value;}});assert.equal(layout.coverColumns,2);
});
test('PDF field labels and colons use embedded SemiBold; every answer stays Regular, including wrapped values',async()=>{
 const rows=[sampleFamily[0],longSample[0]],bytes=await renderTicket(rows),parsed=await parse(bytes);
 try{
  assert.match(bytes.toString('latin1'),/Montserrat-SemiBold/);assert.match(bytes.toString('latin1'),/Montserrat-Regular/);
  const labels=['Участие',...ticketGuest(longSample[0]).fields.map(f=>f.label)];
  for(const {page} of parsed.pages){
   const items=(await page.getTextContent()).items.filter(item=>item.str?.trim());
   const status=items.find(item=>item.str.trim()==='Участие:');if(!status)continue;
   const answer=items.find(item=>item.str.trim()==='Приду');assert.ok(answer);
   assert.notEqual(status.fontName,answer.fontName,'label and answer use distinct embedded faces');
   for(const item of items.filter(item=>item.fontName===status.fontName)){
    assert.ok(labels.some(label=>(label+':').includes(item.str.trim())),'SemiBold is limited to a field label or its wrapped fragment: '+item.str);
    assert.ok(item.height>=13.95);
   }
   for(const label of labels){const fragments=items.filter(item=>item.fontName===status.fontName&&label.includes(item.str.trim().replace(/:$/,'')));if(fragments.length)assert.ok(fragments.every(item=>item.height>=13.95));}
   const valueItems=items.filter(item=>item.str.includes('Вино красное')||item.str.includes('ОченьДлинноеСлово')||item.str.includes('Вместе с Александром'));
   assert.ok(valueItems.length);assert.ok(valueItems.every(item=>item.fontName===answer.fontName),'long values keep Regular across line wraps');
  }
 }finally{await parsed.destroy();}
});
for(const count of [1,2,3,4,5])test(`PDF ${count} guests: Cyrillic, personal answers, readable pages and real link annotations`,async()=>{
 const rows=sampleFamily.slice(0,count),parsed=await parse(await renderTicket(rows));
 try{const text=parsed.pages.map(p=>p.text).join(' '),links=parsed.pages.flatMap(p=>p.links);
 const titleItems=(await parsed.pages[0].page.getTextContent()).items.filter(item=>item.str?.trim()&&item.height>40);assert.ok(titleItems.length>=2);assert.ok(titleItems.every(item=>Math.abs(item.transform[5]-titleItems[0].transform[5])<1),'hero-style names stay on one line');
 assert.ok(!parsed.pages[0].text.includes(wedding.date),'cover has no duplicated top date');assert.ok(parsed.pages.slice(1).every(p=>p.text.includes(wedding.date)),'continuation pages retain date header');assert.ok(!text.includes('С любовью'));
 for(const row of rows){assert.equal(text.split(row.guest_name).length-1,2,row.guest_name+' appears on invitation and its own answer');const cardPage=parsed.pages.filter(p=>p.text.includes(row.guest_name)).at(-1);for(const field of ticketGuest(row).fields)assert.ok(cardPage.text.includes(field.value),'guest card remains together: '+field.label);}
 for(const {page} of parsed.pages)for(const item of (await page.getTextContent()).items){if(item.str?.trim()&&item.transform[5]<780&&item.transform[5]>60)assert.ok(item.height>=13.95,'14pt minimum');}
 assert.ok(parsed.doc.numPages>=2&&parsed.doc.numPages<=8);assert.ok(parsed.pages.every(p=>p.text.length>250),'no orphan/empty pages');
 for(const expected of ['15:00','15:30','16:00','21:00','22:00',wedding.venue.name,wedding.venue.address,'Что мы сохранили','Не приду'].filter(value=>rows.some(row=>row.attendance==='no')||value!=='Не приду'))assert.ok(text.includes(expected),expected);
 for(const url of [ANYA_TELEGRAM_URL,MAXIM_TELEGRAM_URL,PUBLIC_ORIGIN,PUBLIC_ORIGIN+'/#dress-code',wedding.venue.mapUrl])assert.ok(links.some(link=>new URL(link).href===new URL(url).href),url);
 assert.ok(!text.includes('localhost'));assert.ok(!text.includes('Кто вы'));assert.ok(!text.includes('Музыка'));
 }finally{await parsed.destroy();}
});
test('declined ticket has no irrelevant answers; optional omissions and different guest choices stay distinct',()=>{
 assert.deepEqual(ticketGuest({guest_name:'Алексей Петров',attendance:'no',food:'must not appear'}).fields,[]);
 assert.ok(ticketGuest(sampleFamily[0]).fields.some(f=>f.value==='Нужен трансфер от Купчино'));
 assert.ok(ticketGuest(sampleFamily[1]).fields.some(f=>f.value==='Нужен трансфер от Павловска'));
});
test('long Cyrillic names, unbroken words, full drink selections and allergy paragraphs do not overflow page bounds',async()=>{
 const rows=Array.from({length:5},(_,i)=>({...sampleGuest(('ОченьДлинноеИмя'.repeat(4)+' Фамилия').slice(0,78),i),food:'ДлинноеСлово'.repeat(25),alcohol_drinks:['red_wine','white_wine','cognac','vodka','whisky','rum','gin','jagermeister','other'],alcohol_other:'ДругойНапиток'.repeat(5),soft_drinks:['cola','sprite','fanta','tonic','apple_juice','orange_juice','tomato_juice','still_water','sparkling_water','other'],soft_other:'Особый напиток'}));
 const parsed=await parse(await renderTicket(rows));try{for(const {page} of parsed.pages){const content=await page.getTextContent();for(const item of content.items){if(!item.str?.trim())continue;assert.ok(item.height>=13.95||item.transform[5]>780||item.transform[5]<60,'body text minimum 14pt');assert.ok(item.transform[4]>=24&&item.transform[4]+item.width<=574,'text within horizontal margins');assert.ok(item.transform[5]>=30&&item.transform[5]<=815,'text within vertical margins');}}}finally{await parsed.destroy();}
});
test('long menu labels use the full row and stay with the guest',async()=>{
 const original=mainCourseOptions[1].label;const longLabel='Запечённая рыба с овощами, сливочным соусом, пряными травами и гарниром из сезонных овощей';
 try{mainCourseOptions[1].label=longLabel;const parsed=await parse(await renderTicket([{...sampleGuest('Александра-Мария Петрова-Смирнова'),food:'Аллергия на орехи и кунжут. Просьба проверить состав соусов.'}]));try{assert.ok(parsed.pages.some(p=>p.text.includes(longLabel)&&p.text.includes('Александра-Мария Петрова-Смирнова')));for(const {page} of parsed.pages){const items=(await page.getTextContent()).items;for(const item of items){if(item.str?.trim()&&item.transform[5]<780&&item.transform[5]>60)assert.ok(item.height>=13.95);}}}finally{await parsed.destroy();}}
 finally{mainCourseOptions[1].label=original;}
});
test('calendar is public, complete, Moscow-correct UTC and preserves seven-day alarm',()=>{
 const ics=calendarIcs().replace(/\r\n /g,'');assert.match(ics,/DTSTART:20270717T120000Z/);assert.match(ics,/DTEND:20270717T190000Z/);assert.match(ics,/TRIGGER:-P7D/);assert.match(ics,/X-WR-TIMEZONE:Europe\/Moscow/);assert.ok(ics.includes(wedding.venue.name));assert.ok(ics.includes(PUBLIC_ORIGIN));assert.ok(event.description.includes(wedding.venue.mapUrl));for(const line of calendarIcs().split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
});
test('session capacity, concurrent sixth request, idempotency, deletion, cookie restore and private PDF ownership',async()=>{
 const db=new PGlite();let tail=Promise.resolve();const source={async connect(){const prior=tail;let unlock;tail=new Promise(r=>unlock=r);await prior;return {query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows};},release:unlock};}};
 const old=process.env.PUBLIC_SITE_URL;process.env.PUBLIC_SITE_URL='http://localhost:3000';
 try{
 await db.exec(fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort().map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
 const session=async cookie=>{const r=await getRsvp(new Request('http://localhost:3000/api/rsvp',{headers:cookie?{cookie}:{}}),source);return {cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie,...await r.json()};};
 const a=await session(),b=await session();
 const post=(s,name,key=randomUUID())=>postRsvp(new Request('http://localhost:3000/api/rsvp',{method:'POST',headers:{origin:'http://localhost:3000',cookie:s.cookie,'x-csrf-token':s.csrf,'content-type':'application/json'},body:JSON.stringify({guestName:name,attendance:'no',submissionKey:key})}),source);
 const pdf=(cookie,query='')=>downloadInvitation(new Request('http://localhost:3000/api/rsvp/invitation'+query,{headers:cookie?{cookie}:{}}),source);
 assert.equal((await pdf()).status,401);assert.equal((await pdf(cookieName+'=broken')).status,401);assert.equal((await pdf(a.cookie)).status,404);
 const key=randomUUID();assert.equal((await post(a,'Первый Гость',key)).status,201);
 for(let i=2;i<=4;i++)assert.equal((await post(a,'Гость Номер'+i)).status,201);
 const parallel=await Promise.all([post(a,'Пятый Гость'),post(a,'Шестой Гость')]);assert.deepEqual(parallel.map(r=>r.status).sort(),[201,409]);
 assert.equal((await post(a,'Первый Гость',key)).status,200);assert.equal((await session(a.cookie)).rsvps.length,5);
 assert.equal((await post(b,'Чужой Гость')).status,201);
 const doc=await pdf(a.cookie,'?id='+((await session(b.cookie)).rsvps[0].id));assert.equal(doc.status,200);assert.match(doc.headers.get('cache-control'),/private, no-store/);assert.match(doc.headers.get('content-type'),/application\/pdf/);
 const parsed=await parse(await doc.arrayBuffer());try{assert.ok(!parsed.pages.some(p=>p.text.includes('Чужой Гость')));}finally{await parsed.destroy();}
 const rows=(await session(a.cookie)).rsvps;await db.query('DELETE FROM rsvps WHERE id=$1',[rows[0].id]);assert.equal((await post(a,'Новый Гость')).status,201);assert.equal((await post(a,'Лишний Гость')).status,409);
 await db.query('DELETE FROM rsvps WHERE session_id=(SELECT session_id FROM rsvps WHERE id=$1)',[rows[1].id]);assert.equal((await session(a.cookie)).rsvps.length,0);assert.equal((await pdf(a.cookie)).status,404);for(let i=0;i<5;i++)assert.equal((await post(a,'Гость Заново'+i)).status,201);
 assert.equal((await session(b.cookie)).rsvps.length,1);
 }finally{if(old===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=old;await db.close();}
});
