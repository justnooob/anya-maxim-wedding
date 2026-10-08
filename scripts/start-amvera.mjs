import {spawn} from 'node:child_process';
const role=process.env.APP_ROLE||'web';
let child,stopping=false;
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopping=true;child?.kill(signal);});
function run(args){return new Promise(resolve=>{
  child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});
  child.once('error',()=>resolve(1));child.once('exit',code=>resolve(code??1));
});}
if(role==='bot')process.exitCode=await run(['scripts/telegram-production.mjs']);
else if(role==='web'){
  const code=await run(['scripts/migrate.mjs']);
  if(code!==0)process.exitCode=code;
  else if(!stopping)process.exitCode=await run(['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0']);
}else{console.error('Invalid APP_ROLE. Use web or bot.');process.exitCode=1;}
