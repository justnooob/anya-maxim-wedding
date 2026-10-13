import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {validateRsvp,InputError} from '../src/server/rsvp/validation.mjs';
import {rsvpReady,attendancePayload} from '../src/content/rsvp-limits.mjs';
import {banquetMenu,menuLabel} from '../src/content/menu.mjs';
import {formatGuestList} from '../src/content/admin-copy.mjs';
import {adminAnalytics,guestQuery} from '../src/server/telegram/analytics.mjs';
import {rsvpDetail} from '../src/server/rsvp/detail.mjs';
import {saveRsvp} from '../src/server/rsvp/repository.mjs';
const yes={guestName:'Сергей Иванов',attendance:'yes',who:'Друг',food:'Без орехов',musicRequest:'',transfer:'self',dressCode:true,alcoholDrinks:['red_wine','white_wine'],softDrinks:['none'],alcoholOther:'',softOther:'',hotAppetizer:'hot_meat',mainCourse:'main_fish'};
test('new GOING requires exactly one valid choice for each course on client and server',()=>{
 assert.ok(rsvpReady(yes));assert.equal(validateRsvp(yes).mainCourse,'main_fish');
 for(const patch of [{hotAppetizer:undefined},{mainCourse:undefined},{hotAppetizer:null},{mainCourse:''},{hotAppetizer:'main_meat'},{mainCourse:'hot_fish'},{hotAppetizer:['hot_meat','hot_fish']},{mainCourse:['main_meat']},{mainCourse:'invalid'}]){assert.equal(rsvpReady({...yes,...patch}),false);assert.throws(()=>validateRsvp({...yes,...patch}),InputError);}
 const no=attendancePayload({...yes,attendance:'no'});assert.deepEqual(no,{guestName:'Сергей Иванов',attendance:'no'});assert.ok(rsvpReady(no));
 for(const input of [no,{...yes,attendance:'no',hotAppetizer:['invalid'],mainCourse:'invalid'}]){const result=validateRsvp(input);assert.equal(result.hotAppetizer,null);assert.equal(result.mainCourse,null);}
});
test('menu and drink drill-down count each guest once, identify names and retain legacy missing menu',()=>{
 const rows=[{id:'1',guest_name:'Сергей Иванов',attendance:'yes',hot_appetizer_choice:'hot_meat',main_course_choice:'main_fish',food:'Без орехов',alcohol_drinks:['red_wine','white_wine','red_wine'],soft_drinks:['none']},{id:'2',guest_name:'Анна Петрова',attendance:'yes',hot_appetizer_choice:'hot_fish',main_course_choice:'main_meat',alcohol_drinks:['red_wine'],soft_drinks:['cola']},{id:'3',guest_name:'Старый Гость',attendance:'yes',alcohol_drinks:['none'],soft_drinks:['none']},{id:'4',guest_name:'Не Придёт',attendance:'no',alcohol_drinks:['red_wine']}];
 const a=adminAnalytics(rows);assert.equal(a.food.hotAppetizer.find(g=>g.id==='hot_meat').count,1);assert.equal(a.food.mainCourse.find(g=>g.id==='main_meat').count,1);assert.equal(a.food.hotAppetizer.find(g=>g.id==='unspecified').count,1);
 assert.deepEqual(a.food.hotAppetizer[0].guests,[{id:'1',name:'Сергей Иванов'}]);assert.equal(a.drinks.alcohol.find(g=>g.id==='red_wine').count,2);assert.equal(a.drinks.alcohol.find(g=>g.id==='white_wine').count,1);assert.equal(a.drinks.soft.find(g=>g.id==='none').count,2);assert.equal(a.diet.length,1);
 assert.equal(formatGuestList(a.food.hotAppetizer[0].label,a.food.hotAppetizer[0].guests),'Мясная горячая закуска — 1 гость\nСергей Иванов');
 const details=rsvpDetail(rows[0]);assert.equal(details.fields.find(f=>f.label==='Основное блюдо').value,banquetMenu.mainCourse.options.find(o=>o.id==='main_fish').label);assert.equal(menuLabel('hotAppetizer',null),'Пока не выбрано');assert.ok(!rsvpDetail(rows[3]).fields.some(f=>f.label==='Основное блюдо'));
 const q=guestQuery(new URLSearchParams({hotAppetizer:'hot_meat',mainCourse:'main_fish'}));assert.ok(q.args.includes('hot_meat'));assert.match(q.sql,/main_course_choice=\$/);assert.throws(()=>guestQuery(new URLSearchParams({hotAppetizer:'invalid'})));
});
test('migration 009 preserves existing RSVP, stores choices and constrains canonical keys',async()=>{
 const db=new PGlite();try{
 const files=fs.readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort();await db.exec(files.filter(n=>n<'009').map(n=>fs.readFileSync('migrations/'+n,'utf8')).join('\n'));
 const sid='a'.repeat(64),oldId='00000000-0000-4000-8000-000000000001';await db.query("INSERT INTO guest_sessions(id,expires_at) VALUES($1,now()+interval '1 year')",[sid]);await db.query("INSERT INTO rsvps(id,session_id,guest_name,attendance,who,transfer,dress_code,alcohol_drinks,soft_drinks) VALUES($1,$2,'Старый Гость','yes','Друг','self',true,ARRAY['none'],ARRAY['none'])",[oldId,sid]);
 await db.exec(fs.readFileSync('migrations/009_banquet_menu.sql','utf8'));
 const legacy=(await db.query('SELECT * FROM rsvps WHERE id=$1',[oldId])).rows[0];assert.equal(legacy.guest_name,'Старый Гость');assert.equal(legacy.hot_appetizer_choice,null);assert.equal(legacy.main_course_choice,null);
 const saved=await saveRsvp({query:(sql,args)=>db.query(sql,args)},sid,validateRsvp({...yes,submissionKey:'00000000-0000-4000-8000-000000000002'}),new Set());assert.equal(saved.rsvp.hot_appetizer_choice,'hot_meat');assert.equal(saved.rsvp.main_course_choice,'main_fish');
 await assert.rejects(db.query('UPDATE rsvps SET hot_appetizer_choice=$1 WHERE id=$2',['invalid',oldId]));
 const q=guestQuery(new URLSearchParams({hotAppetizer:'hot_meat',mainCourse:'main_fish'}));assert.equal((await db.query(q.sql,q.args)).rows.length,1);
 }finally{await db.close();}
});
