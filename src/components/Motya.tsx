"use client";
import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {createMeowGate,startRecordedMeow,motyaCopy} from '@/client/motya.mjs';
export function Motya(){
 const gate=useRef<ReturnType<typeof createMeowGate>|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [toast,setToast]=useState(0);
 useEffect(()=>()=>{gate.current?.dispose();if(timer.current)clearTimeout(timer.current);},[]);
 async function meow(){
  if(!gate.current){let storage:Storage|undefined;try{storage=sessionStorage;}catch{}gate.current=createMeowGate({storage,start:startRecordedMeow});}
  const result=await gate.current.attempt();if(result!=='limit')return;
  setToast(value=>value+1);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(0),5000);
 }
 return <><button type="button" className="question-link motya-link" onClick={()=>void meow()}>{motyaCopy.label}</button>{toast>0&&createPortal(<span key={toast} className="motya-toast" role="status">{motyaCopy.toast}</span>,document.body)}</>;
}
