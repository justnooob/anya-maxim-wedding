"use client";
import {useEffect,useState,type RefObject} from 'react';
import {scrollIntent} from './dress-navigation.mjs';
import {subscribeViewportFrame} from '@/client/viewport-frame.mjs';

export function useDressFloating(root:RefObject<HTMLElement|null>,tabs:RefObject<HTMLDivElement|null>){
 const [state,setState]=useState({visible:false,expanded:false,tabsVisible:false});
 useEffect(()=>{
  let last=window.scrollY;let intent={direction:0,distance:0,expanded:false};
  function measure(countIntent:boolean){
   const el=root.current;if(!el)return;const y=window.scrollY,delta=y-last;last=y;
   const rect=el.getBoundingClientRect(),height=window.innerHeight;
   // The complete dock must fit inside its chapter. Otherwise it can cover the
   // next heading while the last few pixels of Dress Code are still onscreen.
   const dock=document.querySelector<HTMLElement>('.dress-floating');
   const dockBottom=(dock?.offsetHeight??0)+(dock?parseFloat(getComputedStyle(dock).top)||0:0);
   const visible=rect.top<=0&&rect.bottom>dockBottom;
   const original=tabs.current?.getBoundingClientRect();const tabsVisible=!!original&&original.bottom>0&&original.top<height;
   if(!visible)intent={direction:0,distance:0,expanded:false};
   else if(countIntent)intent=scrollIntent(intent,delta);
   const next={visible,expanded:intent.expanded&&!tabsVisible,tabsVisible};
   setState(old=>Object.keys(next).every(key=>old[key as keyof typeof old]===next[key as keyof typeof next])?old:next);
  }
  const unsubscribe=subscribeViewportFrame(({scrolled}:{scrolled:boolean})=>measure(scrolled));
  const resize=()=>measure(false);measure(false);
  const observer=new ResizeObserver(resize);if(root.current)observer.observe(root.current);
  return()=>{observer.disconnect();unsubscribe();};
 },[root,tabs]);
 return state;
}
