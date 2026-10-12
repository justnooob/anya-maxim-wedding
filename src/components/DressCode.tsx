"use client";
import {useEffect,useRef,useState,type CSSProperties} from "react";
import {publicSections as content} from "@/content/public-sections";
import {type LookExample} from "@/content/dress-code";
import {Watercolor} from "./Watercolor";

function ExampleCarousel({examples,title,id,direction}:{examples:LookExample[];title:string;id:string;direction:number}){
 const [index,setIndex]=useState(0),[previous,setPrevious]=useState<LookExample|null>(null),[travel,setTravel]=useState(direction),[revision,setRevision]=useState(0);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),gesture=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 function move(delta:number){const next=(index+delta+examples.length)%examples.length;if(timer.current)clearTimeout(timer.current);setPrevious(examples[index]);setTravel(delta);setIndex(next);setRevision(v=>v+1);timer.current=setTimeout(()=>setPrevious(null),750);}
 const copy=content.dress;
 function frame(item:LookExample,kind:string){return <div className={"lookbook-frame "+kind}>
  <div className="lookbook-photo">{item.image?<img src={item.image} alt={item.title} loading="lazy" draggable={false}/>:<div className="lookbook-placeholder"><span aria-hidden="true">А & М</span><p>{copy.placeholder}</p></div>}</div>
  <div className="lookbook-description"><span className="chapter-kicker">{title}</span><h4>{item.title}</h4><p>{item.description}</p></div>
 </div>;}
 return <section id={id} className="lookbook" aria-labelledby={id+"-title"}>
  <h3 id={id+"-title"}>{title}</h3>
  <div className="lookbook-stage" tabIndex={0} role="region" aria-label={title+": "+copy.galleryLabel} style={{"--look-direction":travel} as CSSProperties}
   onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}}}
   onPointerDown={e=>{gesture.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(start&&Math.abs(e.clientX-start.x)>40&&Math.abs(e.clientX-start.x)>Math.abs(e.clientY-start.y))move(e.clientX<start.x?1:-1);}}
   onPointerCancel={()=>{gesture.current=null;}}>
   <div className="lookbook-frames" key={revision}>
    {previous&&<div aria-hidden="true" inert>{frame(previous,"lookbook-outgoing")}</div>}
    {frame(examples[index],"lookbook-incoming")}
   </div>
  </div>
  <div className="dress-gallery-controls"><button type="button" aria-label={title+": "+copy.previous} onClick={()=>move(-1)}>←</button><span className="gallery-counter" aria-live="polite">{String(index+1).padStart(2,'0')} / {String(examples.length).padStart(2,'0')}</span><button type="button" aria-label={title+": "+copy.next} onClick={()=>move(1)}>→</button></div>
 </section>;
}
export function DressCode(){
 const [page,setPage]=useState(0),[direction,setDirection]=useState(1);
 const dress=content.dress,selected=dress.categories[page];
 return <section className="dress-chapter chapter" id="dress-code" aria-labelledby="dress-title">
  <header className="chapter-heading"><h2 id="dress-title">{dress.title}</h2><p>{dress.intro}</p></header>
  <div className="page-switch" aria-label="Примеры дресс-кода">{dress.categories.map((category,i)=><button key={category.id} type="button" aria-pressed={page===i} aria-controls="dress-examples" onClick={()=>{if(i!==page){setDirection(i===0?-1:1);setPage(i);}}}>{category.label}</button>)}</div>
  <div id="dress-examples" className="dress-lookbook" key={selected.id}>
   <h3 className="palette-title">{dress.paletteTitle}</h3>
   <div className="dress-palette">{selected.palette.map(color=><span key={color.name}><i style={{backgroundColor:color.color}} aria-hidden="true"/><strong>{color.name}</strong><small>{color.example}</small></span>)}</div>
   <div className="lookbook-guidance"><div><h3>{dress.materialsTitle}</h3><p>{selected.materials}</p></div><p>{selected.explanation}</p></div>
   <ExampleCarousel examples={selected.allowed} title={dress.allowedTitle} id="dress-allowed" direction={direction}/>
   <ExampleCarousel examples={selected.avoid} title={dress.avoidTitle} id="dress-avoid" direction={direction}/>
  </div>
  <Watercolor kind="atelier-05" className="dress-watercolor"/><Watercolor kind="atelier-06" className="dress-watercolor-secondary"/>
 </section>;
}
