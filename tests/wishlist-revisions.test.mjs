import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {productNote} from '../src/content/wishlist-products.mjs';
const plan=JSON.parse(fs.readFileSync('docs/wishlist-revisions-2026-11-05.json'));
test('revision handoff has seven existing targets, no insertion/publication instructions and preserves confirmed prices',()=>{
 assert.equal(plan.databaseChanged,false);assert.equal(plan.items.length,7);assert.equal(new Set(plan.items.map(i=>i.match.seedKey)).size,7);
 for(const item of plan.items){assert.equal(item.operation,'update-existing-only');assert.ok(item.match.oldTitle);assert.ok(!('isVisible' in item.proposed));assert.ok(!('id' in item.proposed));assert.ok(item.proposed.links.every(l=>/^https:\/\/www\.ozon\.ru\/product\/.+-\d+\/$/.test(l.url)));if(item.proposed.image){const data=fs.readFileSync('public'+item.proposed.image);assert.equal(data.subarray(8,12).toString(),'WEBP');}}
 const frame=plan.items.find(i=>i.match.seedKey==='initial-v1:08');
 assert.equal(frame.proposed.price,5389);
 assert.match(frame.proposed.title,/10,1″/);
 assert.ok(frame.proposed.image.endsWith('/frame-white.webp'));
 assert.equal(plan.items.find(i=>i.match.seedKey==='initial-v1:21').proposed.price,10102);
});
test('white Canon purchasing note matches revised colour without changing legacy black gifts',()=>{
 assert.match(productNote('Canon SELPHY CP1500, белый'),/белый/);assert.doesNotMatch(productNote('Canon SELPHY CP1500, белый'),/чёрный/);assert.match(productNote('Canon SELPHY CP1500'),/чёрный/);
});
