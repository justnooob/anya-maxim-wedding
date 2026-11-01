import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {calendarCountdown,russianUnit} from '../src/client/countdown.mjs';
const target=Date.parse('2027-07-17T15:00:00+03:00');
const values=now=>calendarCountdown(Date.parse(now),target);
const shape=(months,days,hours=0,minutes=0,seconds=0)=>({months,days,hours,minutes,seconds,finished:false});
for(const [name,now,expected]of [
 ['second rollover','2027-07-17T11:58:59Z',shape(0,0,0,1,1)],
 ['minute rollover','2027-07-17T10:59:59Z',shape(0,0,1,0,1)],
 ['hour rollover','2027-07-16T11:59:59Z',shape(0,1,0,0,1)],
 ['calendar month rollover','2027-06-17T12:00:00Z',shape(1,0)],
 ['30-day month','2027-06-16T12:00:00Z',shape(1,1)],
 ['31-day month end','2027-01-31T12:00:00Z',shape(5,17)],
 ['February 2027','2027-02-28T12:00:00Z',shape(4,19)],
 ['year transition','2026-12-17T12:00:00Z',shape(7,0)],
 ['last full second','2027-07-17T11:59:59Z',shape(0,0,0,0,1)],
 ['last millisecond','2027-07-17T11:59:59.999Z',shape(0,0,0,0,1)],
])test('countdown '+name,()=>assert.deepEqual(values(now),expected));
for(const now of [target,target+1,target+86400000])test('countdown clamps zero at '+now,()=>assert.deepEqual(calendarCountdown(now,target),{...shape(0,0),finished:true}));
test('calendar month clamps leap-year month end',()=>assert.deepEqual(calendarCountdown(Date.parse('2028-01-31T12:00:00Z'),Date.parse('2028-02-29T12:00:00Z')),shape(1,0)));
test('countdown ranges remain sane across every 2026/2027 calendar day',()=>{for(let now=Date.parse('2026-01-01T12:30:01Z');now<target;now+=86400000){const r=calendarCountdown(now,target);assert.ok(r.months>=0&&r.days>=0&&r.days<=31&&r.hours>=0&&r.hours<24&&r.minutes>=0&&r.minutes<60&&r.seconds>=0&&r.seconds<60);}});
test('Russian plural forms include teens and zero',()=>{const forms=['месяц','месяца','месяцев'];for(const [n,w]of [[0,'месяцев'],[1,'месяц'],[2,'месяца'],[5,'месяцев'],[11,'месяцев'],[14,'месяцев'],[21,'месяц'],[22,'месяца'],[25,'месяцев']])assert.equal(russianUnit(n,forms),w);});
for(const timezone of ['Europe/Moscow','Europe/Berlin','Asia/Tokyo','America/New_York'])test('countdown absolute target is independent of '+timezone,()=>{
 const output=execFileSync(process.execPath,['--input-type=module','-e',"import {calendarCountdown} from './src/client/countdown.mjs';process.stdout.write(JSON.stringify(calendarCountdown(Date.parse('2026-12-31T22:00:00Z'),Date.parse('2027-07-17T15:00:00+03:00'))));"],{env:{...process.env,TZ:timezone},encoding:'utf8'});
 assert.deepEqual(JSON.parse(output),values('2026-12-31T22:00:00Z'));
});
