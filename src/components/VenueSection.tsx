"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {publicSections as content} from '@/content/public-sections';
import {useDialogExit} from './useDialogExit';

export function VenueSection(){
 const venue=content.venue;
 const [index,setIndex]=useState(0),[previous,setPrevious]=useState<number|null>(null),[fullscreen,setFullscreen]=useState(false),[visible,setVisible]=useState(false),[revision,setRevision]=useState(0);
 const gallery=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null),deadline=useRef(0),firstSwapAt=useRef<number|null>(null),autoStarted=useRef(false),lastSwipe=useRef(0),gesture=useRef<{x:number;y:number}|null>(null);
 const {closing,requestClose}=useDialogExit(()=>setFullscreen(false));
 const select=useCallback((delta:number)=>{deadline.current=Date.now()+venue.manualPause;setIndex(value=>{setPrevious(value);return(value+delta+venue.images.length)%venue.images.length;});setRevision(v=>v+1);},[venue.manualPause,venue.images.length]);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)&&firstSwapAt.current===null){firstSwapAt.current=Date.now()+venue.firstAutoDelay;setVisible(true);observer.disconnect();}},{threshold:.15});if(gallery.current)observer.observe(gallery.current);const refresh=()=>setRevision(v=>v+1);document.addEventListener('visibilitychange',refresh);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',refresh);};},[venue.firstAutoDelay]);
 useEffect(()=>{
  if(!visible||fullscreen||document.hidden||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  // One effect owns one timer. First exposure starts the initial ten-second wait;
  // manual navigation and the modal may postpone it, never bring it forward.
  const wait=Math.max(autoStarted.current?venue.autoInterval:0,(firstSwapAt.current??Date.now())-Date.now(),deadline.current-Date.now());
  const timer=setTimeout(()=>{autoStarted.current=true;setPrevious(index);setIndex((index+1)%venue.images.length);},wait);return()=>clearTimeout(timer);
 },[index,visible,fullscreen,revision,venue.autoInterval,venue.images.length]);
 useEffect(()=>{
  if(!fullscreen)return;const modal=dialog.current;if(!modal)return;
  const trigger=opener.current;const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';modal.showModal();
  return()=>{modal.close();document.body.style.overflow=previousOverflow;trigger?.focus({preventScroll:true});};
 },[fullscreen]);
 const keys=(event:React.KeyboardEvent)=>{
  if(event.key==='Tab'&&fullscreen){
   const controls=[...dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
  const k=event.key.toLowerCase();if(['arrowleft','arrowright','a','d'].includes(k)){event.preventDefault();event.stopPropagation();select(k==='arrowleft'||k==='a'?-1:1);}
 };
 const start=(event:React.PointerEvent)=>{if(event.button===0){gesture.current={x:event.clientX,y:event.clientY};try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}}};
 const end=(event:React.PointerEvent)=>{const point=gesture.current;gesture.current=null;if(!point)return;const x=event.clientX-point.x,y=event.clientY-point.y;if(Math.abs(x)>45&&Math.abs(x)>Math.abs(y)){event.preventDefault();select(x<0?1:-1);return true;}return false;};
 const photo=venue.images[index];
 return <section className="venue-chapter chapter venue-panorama" id="venue" aria-labelledby="venue-title">
  <div className="venue-photo venue-gallery" ref={gallery} role="region" aria-label={venue.galleryLabel} onKeyDown={keys}>
   <button className="venue-photo-open" ref={opener} aria-label={venue.openGallery} onPointerDown={start} onPointerUp={event=>{if(end(event))lastSwipe.current=Date.now();}} onPointerCancel={()=>{gesture.current=null;}} onClick={()=>{if(Date.now()-lastSwipe.current<500)return;setFullscreen(true);}}>
    <span className="venue-frames" key={index}>{previous!==null&&previous!==index&&<img className="venue-outgoing-photo" src={venue.images[previous].src} alt="" aria-hidden="true" draggable={false}/>}<img className={'venue-current-photo'+(previous!==null&&previous!==index?' venue-incoming-photo':'')} src={photo.src} alt={photo.alt} loading="lazy" draggable={false}/></span>
   </button>
  </div>
  <div className="venue-copy"><span className="chapter-kicker">{venue.eyebrow}</span><h2 id="venue-title">{venue.title}</h2><p className="venue-name">{venue.name}</p><p className="venue-address">{venue.address}</p><a className="foil-button" href={venue.mapUrl} target="_blank" rel="noopener noreferrer"><span>{venue.mapLabel}</span><span aria-hidden="true">→</span></a></div>
  <dialog className="venue-lightbox" ref={dialog} data-closing={closing} aria-label={venue.galleryLabel} onKeyDown={keys} onCancel={event=>{event.preventDefault();requestClose();}} onClick={event=>{if(event.target===event.currentTarget)requestClose();}}>
   <button type="button" className="venue-lightbox-close" aria-label={venue.closeGallery} onClick={requestClose}>{venue.closeGallery} ×</button>
   <div className="venue-lightbox-photo" onPointerDown={start} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;}}><img src={photo.src} alt={photo.alt} draggable={false}/></div>
   <div className="venue-lightbox-controls"><button aria-label={venue.previous} onClick={()=>select(-1)}>←</button><span role="status">{index+1} / {venue.images.length}</span><button aria-label={venue.next} onClick={()=>select(1)}>→</button></div>
  </dialog>
 </section>;
}
