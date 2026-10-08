import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
// Render the actual component in a restored/submitted guest-session state.
// Effects are intentionally disabled: this fixture never calls a real database or Telegram.
export function renderRsvp({sent=true,attendance='yes',name='Сергей',error='',saved}={}){
 let stateIndex=0;
 const states={0:attendance,1:name,10:sent,13:error,...(saved?{16:saved}:{})};
 const hooks={...React,useState:initial=>{const index=stateIndex++;return [Object.hasOwn(states,index)?states[index]:initial,()=>{}];},useEffect:()=>{},useCallback:fn=>fn,useRef:()=>({current:null})};
 const cache=new Map();
 function load(filename){
  if(cache.has(filename))return cache.get(filename).exports;
  const compiled={exports:{}};cache.set(filename,compiled);
  const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  const localRequire=id=>{
   if(id==='react')return hooks;
   if(id.startsWith('@/')||id.startsWith('.')){
    const base=id.startsWith('@/')?path.resolve('src',id.slice(2)):path.resolve(path.dirname(filename),id);
    const target=[base,base+'.tsx',base+'.ts',base+'.mjs'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
    if(target)return load(target);
   }
   return require(id);
  };
  new Function('require','module','exports',output)(localRequire,compiled,compiled.exports);
  return compiled.exports;
 }
 const {RSVP}=load(path.resolve('src/components/RSVP.tsx'));
 return renderToStaticMarkup(React.createElement(RSVP));
}
