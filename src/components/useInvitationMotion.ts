"use client";
import {useEffect,useRef,type RefObject} from 'react';
import {subscribeViewportFrame} from '@/client/viewport-frame.mjs';
import {motionProfiles,motionRootMargin,motionScenes} from '@/client/motion-scenes.mjs';
type Profile=keyof typeof motionProfiles;
export function useInvitationMotion(root:RefObject<HTMLElement|null>,enabled:boolean){
 const completed=useRef(new Set<string>());
 useEffect(()=>{
  const main=root.current;if(!enabled||!main)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const seen=new WeakSet<Element>(),pending=new Map<HTMLElement,Profile>(),observers=new Map<Profile,IntersectionObserver>(),frames=new Set<number>();
  let lastY=window.scrollY;
  function later(callback:()=>void){const id=requestAnimationFrame(()=>{frames.delete(id);callback();});frames.add(id);}
  function reveal(el:HTMLElement,instant=false){
   if(el.dataset.motionKey)completed.current.add(el.dataset.motionKey);
   pending.delete(el);for(const observer of observers.values())observer.unobserve(el);
   if(instant){el.dataset.motionInstant='true';later(()=>later(()=>{delete el.dataset.motionInstant;}));}
   el.classList.add('motion-visible');el.dataset.motionState='visible';
   // RSVP is one continuous entrance led by its intro, including offscreen
   // fields. Newly mounted attendance details join the same completed scene.
   for(const child of pending.keys())if(child.dataset.motionTriggerSelector&&main!.querySelector(child.dataset.motionTriggerSelector)===el)reveal(child,instant);
   if(el.matches('.schedule-spread li')){
    const list=el.parentElement!,progress=el===list.lastElementChild?1:Math.min(1,(el.offsetTop+26)/Math.max(1,list.offsetHeight-60));
    const next=Math.max(Number(list.dataset.lineProgress||0),progress);list.dataset.lineProgress=String(next);list.style.setProperty('--line-progress',String(next));
   }
  }
  function makeObservers(){
   for(const observer of observers.values())observer.disconnect();observers.clear();
   if(typeof IntersectionObserver==='undefined')return;
   for(const profile of Object.keys(motionProfiles) as Profile[]){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)reveal(entry.target as HTMLElement);else if(entry.boundingClientRect.bottom<=0)reveal(entry.target as HTMLElement,true);}},{threshold:0,rootMargin:motionRootMargin(innerHeight,profile)});
    observers.set(profile,observer);
   }
   for(const [el,profile]of pending)if(!el.dataset.motionTriggerSelector)observers.get(profile)?.observe(el);
  }
  makeObservers();
  function register(){
   for(const {selector,profile,trigger}of motionScenes){
    main!.querySelectorAll<HTMLElement>(selector).forEach((el,index)=>{
     if(seen.has(el)||el.closest('[inert],[aria-hidden="true"]'))return;seen.add(el);
     const identity=el.dataset.guestId||el.id||(el.matches('.lookbook-description')?`${el.closest('.lookbook')?.id}:caption`:`${selector}:${index}`);
     el.dataset.motionKey=identity;el.dataset.motionProfile=profile;el.dataset.motionTrigger=String(motionProfiles[profile as Profile]);
     if(trigger){el.dataset.motionTriggerSelector=trigger;el.style.setProperty('--rsvp-motion-delay',`${100+index*85}ms`);}
     if(el.matches('.watercolor'))el.style.setProperty('--motion-opacity',getComputedStyle(el).opacity);
     if(media.matches||!observers.size){el.dataset.motionState='visible';el.classList.add('motion-visible');completed.current.add(identity);return;}
     el.classList.add('motion-ready');el.classList.remove('motion-visible');el.dataset.motionState='pending';
     if(el.matches('.schedule-spread li'))el.parentElement!.classList.add('timeline-ready');
     if(completed.current.has(identity)||el.getBoundingClientRect().bottom<=0)reveal(el,true);
     else{pending.set(el,profile as Profile);if(trigger){if(main!.querySelector(trigger)?.classList.contains('motion-visible'))reveal(el);}else observers.get(profile as Profile)?.observe(el);}
    });
   }
   for(const [el,profile]of pending)if(!el.isConnected){observers.get(profile)?.unobserve(el);pending.delete(el);}
  }
  register();
  // Timer text updates do not register a scene again. Structural changes and
  // activation of the inert family side are the only mutation work here.
  const changes=new MutationObserver(records=>{if(records.some(record=>record.type==='attributes'||[...record.addedNodes,...record.removedNodes].some(node=>node instanceof HTMLElement)))register();});
  changes.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['inert']});
  const unsubscribe=subscribeViewportFrame(({resized}:{resized:boolean})=>{
   const jump=Math.abs(window.scrollY-lastY)>innerHeight*.9;lastY=window.scrollY;
   if(resized)makeObservers();
   const atEnd=window.scrollY+innerHeight>=document.documentElement.scrollHeight-2;
   if(jump||resized||atEnd)for(const [el,profile]of pending){const box=el.getBoundingClientRect();if(box.bottom<=0||(jump&&box.top<innerHeight))reveal(el,true);else if((atEnd&&box.top<innerHeight)||(resized&&box.top<innerHeight*motionProfiles[profile]))reveal(el);}
  });
  const focus=(event:FocusEvent)=>{let el=event.target as HTMLElement|null;while(el&&el!==main){if(pending.has(el))reveal(el,true);el=el.parentElement;}};
  main.addEventListener('focusin',focus);
  const reduce=()=>{if(media.matches){for(const el of pending.keys())reveal(el,true);main.querySelectorAll('.motion-ready').forEach(el=>el.classList.remove('motion-ready'));main.querySelectorAll('.timeline-ready').forEach(el=>el.classList.remove('timeline-ready'));}};
  media.addEventListener('change',reduce);
  return()=>{unsubscribe();for(const observer of observers.values())observer.disconnect();changes.disconnect();main.removeEventListener('focusin',focus);media.removeEventListener('change',reduce);for(const id of frames)cancelAnimationFrame(id);};
 },[root,enabled]);
}
