// Local-only easter egg: no analytics and no external audio requests.
export const MEOW_SESSION_KEY='anya-maxim-motya-meows-v1';
export const motyaCopy={label:'кота Моти',toast:'Хватит мучать Мотю'};
export function createMeowGate({storage,start}){
 let count=0,playing=false,closed=false,stop=null;
 try{const raw=storage?.getItem(MEOW_SESSION_KEY);if(/^[0-3]$/.test(raw||''))count=Number(raw);}catch{}
 return {
  get count(){return count;},get playing(){return playing;},
  async attempt(){
   if(closed)return 'failed';if(playing)return 'busy';if(count>=3)return 'limit';playing=true;
   try{
    const playback=await start(count);
    if(closed){playback.stop?.();return 'failed';}
    stop=playback.stop;count++;try{storage?.setItem(MEOW_SESSION_KEY,String(count));}catch{}
    Promise.resolve(playback.finished).catch(()=>{}).finally(()=>{playing=false;stop=null;});
    return 'played';
   }catch{playing=false;return 'failed';}
  },
  dispose(){closed=true;stop?.();playing=false;}
 };
}
// Recordings supplied and approved by the user, loaded locally only after a user gesture. See MEDIA_ASSETS.md.
export const MEOW_ASSETS=['/audio/motya-meow-1.mp3','/audio/motya-meow-2.mp3','/audio/motya-meow-3.mp3'];
export async function startRecordedMeow(variant){
 const audio=new Audio(MEOW_ASSETS[variant%MEOW_ASSETS.length]);
 audio.preload='auto';audio.volume=.7;let timeout,settle;
 const finished=new Promise(resolve=>{settle=resolve;});
 const stop=()=>{clearTimeout(timeout);audio.pause();audio.removeAttribute('src');audio.load();settle();};
 audio.onended=()=>settle();audio.onerror=()=>settle();
 try{
  await Promise.race([audio.play(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Audio unavailable')),5000);})]);
  clearTimeout(timeout);
  return {finished,stop};
 }catch{stop();throw Error('Audio unavailable');}
}
