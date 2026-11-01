import test from 'node:test';
import assert from 'node:assert/strict';
import {motionProfiles,motionRootMargin,motionScenes} from '../src/client/motion-scenes.mjs';
for(const [profile,fraction]of Object.entries(motionProfiles))test('motion '+profile+' gate follows viewport height across portrait and landscape',()=>{
 for(const height of [280,320,480,653,844,900,1440]){
  const margin=Number(motionRootMargin(height,profile).split(' ')[2].replace('px',''));
  assert.ok(Math.abs((height+margin)/height-fraction)<.002);
  assert.ok(height+margin<=height*.81&&height+margin>=height*.70);
 }
});
test('motion rejects missing or invalid viewport geometry rather than starting beyond the screen',()=>{
 for(const height of [0,-1,NaN,Infinity])assert.throws(()=>motionRootMargin(height,'scene'),TypeError);
 assert.throws(()=>motionRootMargin(900,'unknown'),TypeError);
});
test('motion uses separate reading windows without registering every input, word or letter',()=>{
 assert.equal(new Set(motionScenes.map(scene=>scene.profile)).size,4);
 assert.ok(motionScenes.every(scene=>motionProfiles[scene.profile]!==undefined));
 assert.ok(motionScenes.every(scene=>!/(^|[ >,])(input|textarea|span)([ >,.]|$)/.test(scene.selector)));
});
