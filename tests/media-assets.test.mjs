import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MEOW_ASSETS} from '../src/client/motya.mjs';
import {familySides} from '../src/content/family-sides.mjs';

test('family sides preserve the approved relatives-only composition without featured couple cards',()=>{
 const ids=[];
 for(const side of ['groom','bride']){
  assert.equal(familySides[side].couple,undefined);
  assert.ok(familySides[side].guestIds.length>0);
  assert.ok(familySides[side].guestIds.every(id=>/^family-\d+$/.test(id)));
  ids.push(...familySides[side].guestIds);
 }
 assert.equal(ids.length,15);assert.equal(new Set(ids).size,15);
});

test('Motya uses three distinct supplied local recordings and no synthesized audio',async()=>{
 assert.equal(MEOW_ASSETS.length,3);const hashes=[];
 for(const asset of MEOW_ASSETS){assert.match(asset,/^\/audio\/motya-meow-[123]\.mp3$/);const bytes=await readFile(new URL('../public'+asset,import.meta.url));assert.ok(bytes.length>1000);hashes.push(createHash('sha256').update(bytes).digest('hex'));}
 assert.equal(new Set(hashes).size,3);
 const adapter=await readFile(new URL('../src/client/motya.mjs',import.meta.url),'utf8');assert.doesNotMatch(adapter,/createOscillator|startSynthMeow|speechSynthesis/);
});

test('all fifteen approved relative portraits exist at an appropriate local media budget',async()=>{
 const names=['olga','vladislav','galina-nikolaevna','sergey-ivanovich','natalya','lidia-vasilyevna','oleg','maria','nadezhda-konstantinovna','anatoly','vyacheslav','darya','galina-ivanovna','angelina','ekaterina'];
 for(const name of names){const file=new URL(`../public/images/guests/${name}.webp`,import.meta.url),bytes=await readFile(file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok((await stat(file)).size<200000);}
});

test('all eleven approved friend portraits exist as optimized local WebP files',async()=>{
 const names=['karina','asel','alexandra','irina','ilya','daniil','anastasia','viktoria','sergey','denis','andrey'];
 for(const name of names){const file=new URL(`../public/images/guests/friends/${name}.webp`,import.meta.url),bytes=await readFile(file);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok((await stat(file)).size<220000);}
});
