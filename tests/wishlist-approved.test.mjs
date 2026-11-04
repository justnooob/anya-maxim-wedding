import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {itemInput} from '../src/server/wishlist/validation.mjs';

const gifts=JSON.parse(await readFile(new URL('../src/server/wishlist/approved-2026-11-04.json',import.meta.url),'utf8'));
test('selected gifts are exactly 19 unpublished, uniquely identified drafts',()=>{
 assert.equal(gifts.length,19);
 assert.equal(new Set(gifts.map(x=>x.seedKey)).size,19);
 assert.equal(new Set(gifts.map(x=>x.title.toLowerCase())).size,19);
 for(const gift of gifts){
  assert.equal(gift.isVisible,false);
  assert.equal(gift.reservationMode,'single');
  assert.match(gift.seedKey,/^approved-nov-2026:\d{2}$/);
  assert.ok(['home','cozy','tech','kitchen'].includes(gift.category));
  const data=itemInput(gift);
  assert.equal(data.title,gift.title);
  assert.ok(data.links.length>=1);
 }
});
test('one kitchen TV only, matched karaoke, three glass types and owner-approved additions',()=>{
 const titles=gifts.map(x=>x.title.toLowerCase());
 assert.equal(titles.filter(x=>x.startsWith('кухонный телевизор')).length,1);
 assert.ok(titles.some(x=>x.includes('tuvio td32ffbch11')));
 assert.ok(!titles.some(x=>x.includes('tcl 65c6k')));
 assert.ok(titles.some(x=>x.includes('jbl cinema ktv450')));
 assert.ok(titles.some(x=>x.includes('вино + 2 коньяк + 2 шампанское')));
 assert.ok(titles.some(x=>x.includes('радарный датчик')));
 assert.ok(titles.some(x=>x.includes('mi computer monitor')));
 assert.ok(titles.some(x=>x.includes('beurer fm 60')));
 assert.ok(titles.some(x=>x.includes('dreame l40 ultra ae')));
});

test('latest selection has exactly three gifts and excludes the feeder',()=>{
 const last=gifts.slice(-3);
 assert.deepEqual(last.map(x=>x.seedKey),[
  'approved-nov-2026:17','approved-nov-2026:18','approved-nov-2026:19'
 ]);
 assert.match(last[0].title,/Bosch GSR 12V-30.*06019G9000/);
 assert.match(last[1].title,/PETKIT Eversweet 3 Pro UVC/);
 assert.match(last[2].title,/Samsung.*T7 Shield 2 ТБ/);
 assert.ok(!gifts.some(x=>/Fresh Element Solo|автокормушк/i.test(x.title)));
 for(const item of last){
  assert.equal(item.isVisible,false);
  assert.ok(item.review);
  assert.equal(item.links.length,2);
  assert.ok(item.links.every(x=>x.url.startsWith('https://')));
 }
});
