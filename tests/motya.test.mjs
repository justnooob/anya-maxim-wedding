import test from 'node:test';
import assert from 'node:assert/strict';
import {createMeowGate,MEOW_SESSION_KEY} from '../src/client/motya.mjs';
const storage=()=>{const data=new Map();return{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Motya counts only started meows, rejects overlap, cycles three voices and restores session cap',async()=>{
 const store=storage(),voices=[];let finish;
 const start=async variant=>{voices.push(variant);return{finished:new Promise(resolve=>finish=resolve)}};const gate=createMeowGate({storage:store,start});
 for(let i=0;i<3;i++){const first=gate.attempt();assert.equal(await gate.attempt(),'busy');assert.equal(await first,'played');assert.equal(gate.count,i+1);assert.equal(await gate.attempt(),'busy');assert.equal(gate.count,i+1);finish();await flush();}
 assert.deepEqual(voices,[0,1,2]);assert.equal(await gate.attempt(),'limit');assert.equal(voices.length,3);assert.equal(store.getItem(MEOW_SESSION_KEY),'3');const restored=createMeowGate({storage:store,start});assert.equal(await restored.attempt(),'limit');assert.equal(voices.length,3);
});
test('Motya audio failure is silent, does not count and can retry',async()=>{const store=storage();let fail=true;const gate=createMeowGate({storage:store,start:async()=>{if(fail)throw Error('blocked');return{finished:Promise.resolve()}}});assert.equal(await gate.attempt(),'failed');assert.equal(gate.count,0);assert.equal(gate.playing,false);assert.equal(store.getItem(MEOW_SESSION_KEY),undefined);fail=false;assert.equal(await gate.attempt(),'played');assert.equal(gate.count,1);});
test('Motya corrupt/disabled storage fails gracefully; dispose stops a live voice',async()=>{let stopped=false;const gate=createMeowGate({storage:{getItem:()=>'{corrupt',setItem:()=>{throw Error()}},start:async()=>({finished:new Promise(()=>{}),stop:()=>stopped=true})});assert.equal(gate.count,0);assert.equal(await gate.attempt(),'played');gate.dispose();assert.ok(stopped);assert.equal(await gate.attempt(),'failed');});
