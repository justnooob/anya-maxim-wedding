import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {itemInput} from '../src/server/wishlist/validation.mjs';

const gifts=JSON.parse(await readFile(new URL('../src/server/wishlist/approved-2026-11-04.json',import.meta.url),'utf8'));
test('selected gifts are exactly 16 unpublished, uniquely identified drafts',()=>{
 assert.equal(gifts.length,16);
 assert.equal(new Set(gifts.map(x=>x.seedKey)).size,16);
 assert.equal(new Set(gifts.map(x=>x.title.toLowerCase())).size,16);
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
