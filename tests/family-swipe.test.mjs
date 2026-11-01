import test from 'node:test';
import assert from 'node:assert/strict';
import {familySwipeTarget} from '../src/client/family-swipe.mjs';
import {familySides} from '../src/content/family-sides.mjs';

test('family swipe opens the adjacent side from an intentional 50px gesture',()=>{assert.equal(familySwipeTarget('groom',-50,0),'bride');assert.equal(familySwipeTarget('bride',50,0),'groom');});
test('family swipe ignores short gestures and never loops beyond either edge',()=>{for(const dx of [-49,0,49])for(const side of ['groom','bride'])assert.equal(familySwipeTarget(side,dx,0),null);assert.equal(familySwipeTarget('groom',150,0),null);assert.equal(familySwipeTarget('bride',-150,0),null);});
test('family swipe leaves predominantly vertical gestures to native scrolling',()=>{for(const [dx,dy]of [[20,150],[-60,100],[60,40],[-75,-50]])assert.equal(familySwipeTarget('groom',dx,dy),null);assert.equal(familySwipeTarget('groom',-80,40),'bride');});
test('family swipe rejects non-finite coordinates',()=>{for(const n of [NaN,Infinity,-Infinity]){assert.equal(familySwipeTarget('groom',n,0),null);assert.equal(familySwipeTarget('bride',50,n),null);}});
test('family configuration preserves exact requested orders and covers each relative once',()=>{assert.deepEqual(familySides.groom.guestIds,['family-0','family-1','family-4','family-5','family-6','family-11','family-12','family-13']);assert.deepEqual(familySides.bride.guestIds,['family-2','family-3','family-9','family-10','family-8','family-7','family-14']);const ids=[...familySides.groom.guestIds,...familySides.bride.guestIds];assert.equal(new Set(ids).size,15);assert.deepEqual([...ids].sort(),Array.from({length:15},(_,i)=>'family-'+i).sort());});
