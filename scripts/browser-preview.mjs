// Local-only regression fixture. No production migrations, database or Telegram calls.
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const children=[];let stopping=false;
function start(args,env){const child=spawn(process.execPath,args,{stdio:'inherit',env:{...process.env,...env},windowsHide:true});children.push(child);child.on('exit',()=>{if(!stopping)stop(1);});return child;}
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill();process.exitCode=code;setTimeout(()=>process.exit(code),1000).unref();}
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>stop());
start(['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3300'],{NODE_ENV:'production'});
try{
 let ready=false;for(let i=0;i<100&&!stopping;i++){try{const r=await fetch('http://127.0.0.1:3300/telegram',{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch{}await delay(200);}
 if(!ready)throw new Error('Local production preview did not start');
 start(['tests/helpers/qa-preview.mjs'],{NODE_ENV:'development',QA_PORT:'3310',QA_UPSTREAM_PORT:'3300',QA_BROWSER:'1'});
}catch{console.error('Browser fixture failed to start. Check build and local ports 3300/3310.');stop(1);}
