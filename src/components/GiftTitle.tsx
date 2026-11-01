"use client";
import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

// The full heading stays in the accessibility tree. Only visually clipped
// headings become focusable; a body portal escapes the card's motion wrapper.
export function GiftTitle({title}:{title:string}){
 const heading=useRef<HTMLHeadingElement>(null),tip=useRef<HTMLDivElement>(null),id=useId();
 const [truncated,setTruncated]=useState(false),[open,setOpen]=useState(false),[position,setPosition]=useState({left:12,top:12});
 useEffect(()=>{const node=heading.current;if(!node)return;let alive=true;const measure=()=>{if(alive){const clipped=node.scrollHeight>node.clientHeight+1;setTruncated(clipped);if(!clipped)setOpen(false);}};const observer=new ResizeObserver(measure);observer.observe(node);measure();void document.fonts.ready.then(measure);return()=>{alive=false;observer.disconnect();};},[title]);
 useLayoutEffect(()=>{if(!open)return;const place=()=>{const r=heading.current?.getBoundingClientRect(),t=tip.current;if(!r||!t)return;const w=t.offsetWidth,h=t.offsetHeight;setPosition({left:Math.max(12,Math.min(r.left,window.innerWidth-w-12)),top:Math.max(12,Math.min(r.bottom+8,window.innerHeight-h-12))});};place();const close=()=>setOpen(false),key=(e:KeyboardEvent)=>{if(e.key==='Escape')close();},outside=(e:PointerEvent)=>{if(!heading.current?.contains(e.target as Node)&&!tip.current?.contains(e.target as Node))close();};window.addEventListener('resize',close);window.addEventListener('scroll',place,true);document.addEventListener('keydown',key);document.addEventListener('pointerdown',outside);return()=>{window.removeEventListener('resize',close);window.removeEventListener('scroll',place,true);document.removeEventListener('keydown',key);document.removeEventListener('pointerdown',outside);};},[open,title]);
 return <><h2 ref={heading} className="gift-title" tabIndex={truncated?0:undefined} aria-describedby={open?id:undefined} data-truncated={truncated||undefined} onMouseEnter={()=>truncated&&setOpen(true)} onMouseLeave={()=>{if(document.activeElement!==heading.current)setOpen(false);}} onFocus={()=>truncated&&setOpen(true)} onBlur={()=>setOpen(false)} onClick={()=>truncated&&setOpen(true)}>{title}</h2>{open&&truncated&&createPortal(<div ref={tip} id={id} role="tooltip" className="gift-title-tooltip" style={position}>{title}</div>,document.body)}</>;
}
