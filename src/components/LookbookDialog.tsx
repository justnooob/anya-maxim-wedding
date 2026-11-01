"use client";
import {useEffect,useRef} from 'react';
import {type LookExample} from '@/content/dress-code';
import {publicSections as content} from '@/content/public-sections';
import {LookStatus} from './LookStatus';
import {useDialogExit} from './useDialogExit';

export function LookbookDialog({examples,index,allowed,onMove,onClose,opener}:{examples:LookExample[];index:number;allowed:boolean;onMove:(delta:number)=>void;onClose:()=>void;opener:HTMLElement|null}){
 const dialog=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),gesture=useRef<{x:number;y:number}|null>(null);
 const item=examples[index],copy=content.dress.viewer;
 const {closing,requestClose}=useDialogExit(onClose);
 useEffect(()=>{
  const el=dialog.current!;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';el.showModal();close.current?.focus();
  return()=>{el.close();document.body.style.overflow=overflow;const target=opener?.isConnected?opener:document.querySelector<HTMLElement>('#dress-'+(allowed?'allowed':'avoid')+' .lookbook-incoming .lookbook-open');target?.focus({preventScroll:true});};
 },[opener,allowed]);
 return <dialog ref={dialog} className="lookbook-dialog" data-closing={closing} aria-labelledby="lookbook-dialog-title" onCancel={e=>{e.preventDefault();requestClose();}} onClick={e=>{if(e.target===e.currentTarget)requestClose();}} onKeyDown={e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();onMove(e.key==='ArrowRight'?1:-1);}
  if(e.key==='Tab'){
   const controls=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const first=controls[0],last=controls.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
 }}>
  <div className="lookbook-dialog-sheet">
   <button ref={close} className="lookbook-dialog-close" type="button" aria-label={copy.close} onClick={requestClose}>×</button>
   <div className="lookbook-dialog-photo" onPointerDown={e=>{gesture.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerCancel={()=>{gesture.current=null;}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(start&&Math.abs(e.clientX-start.x)>40&&Math.abs(e.clientX-start.x)>Math.abs(e.clientY-start.y))onMove(e.clientX<start.x?1:-1);}}>
    <img src={item.image!} alt={item.title} draggable={false}/><LookStatus allowed={allowed}/>
   </div>
   <div className="lookbook-dialog-copy"><div className="lookbook-dialog-status"><LookStatus allowed={allowed}/><span className="chapter-kicker">{item.eyebrow??(allowed?content.dress.allowedTitle:content.dress.avoidTitle)}</span></div><h2 id="lookbook-dialog-title">{item.title}</h2><p>{item.description}</p>
    <div className="lookbook-dialog-controls"><button type="button" disabled={index===0} aria-label={copy.previous} onClick={()=>onMove(-1)}>←</button><span aria-live="polite">{String(index+1).padStart(2,'0')} / {String(examples.length).padStart(2,'0')}</span><button type="button" disabled={index===examples.length-1} aria-label={copy.next} onClick={()=>onMove(1)}>→</button></div>
   </div>
  </div>
 </dialog>;
}
