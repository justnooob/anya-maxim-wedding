"use client";
import {useEffect,useRef,useState} from 'react';
export function useDialogExit(onClose:()=>void){
 const [closing,setClosing]=useState(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 function requestClose(){
  if(timer.current)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){onClose();return;}
  setClosing(true);timer.current=setTimeout(()=>{timer.current=null;setClosing(false);onClose();},180);
 }
 return{closing,requestClose};
}
