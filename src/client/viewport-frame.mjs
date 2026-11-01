// One passive viewport listener/RAF shared by public motion and floating tabs.
const subscribers=new Set();let frame=0,scrolled=false,resized=false;
function flush(){frame=0;const event={scrolled,resized};scrolled=resized=false;for(const callback of subscribers)callback(event);}
function schedule(){if(!frame)frame=requestAnimationFrame(flush);}
function scroll(){scrolled=true;schedule();}
function resize(){resized=true;schedule();}
export function subscribeViewportFrame(callback){
 if(!subscribers.size){window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',resize);}
 subscribers.add(callback);
 return()=>{subscribers.delete(callback);if(!subscribers.size){window.removeEventListener('scroll',scroll);window.removeEventListener('resize',resize);cancelAnimationFrame(frame);frame=0;scrolled=resized=false;}};
}
