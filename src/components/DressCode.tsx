"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { publicSections as content } from "@/content/public-sections";
import { Watercolor } from "./Watercolor";
type Category = typeof content.dress.categories[number];

function Catalogue({category,previous,direction,revision}:{category:Category;previous:Category|null;direction:number;revision:number}) {
  const strip = useRef<HTMLDivElement>(null);
  const destination = useRef<number|null>(null);
  const drag = useRef<{x:number;left:number}|null>(null);
  const [position, setPosition] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [dragging, setDragging] = useState(false);
  const dress=content.dress;
  const measure = useCallback(() => {
    const el=strip.current;if(!el)return;
    setAtStart(el.scrollLeft<5);setAtEnd(el.scrollLeft+el.clientWidth>=el.scrollWidth-5);
    const item=el.querySelector("figure");const step=item?(item as HTMLElement).offsetWidth+parseFloat(getComputedStyle(el).gap):1;
    setPosition(Math.min(category.images.length-1,Math.round(el.scrollLeft/step)));
  }, [category.images.length]);
  useEffect(()=>{const el=strip.current;if(!el)return;const observer=new ResizeObserver(measure);observer.observe(el);measure();return()=>observer.disconnect();},[measure]);
  useLayoutEffect(()=>{
    const el=strip.current;if(!el)return;
    destination.current=null;el.scrollTo({left:0,top:0,behavior:"instant"});measure();
  },[category.id,measure]);
  useEffect(()=>{
    const el=strip.current;if(!el)return;
    const settle=()=>{destination.current=null;measure();};
    el.addEventListener("scrollend",settle);
    return()=>el.removeEventListener("scrollend",settle);
  },[category.id,measure]);
  function move(direction:number) {
    const el=strip.current;if(!el)return;
    const item=el.querySelector<HTMLElement>("figure");
    const step=item?item.offsetWidth+parseFloat(getComputedStyle(el).gap):el.clientWidth;
    const base=destination.current??Math.round(el.scrollLeft/step)*step;
    destination.current=Math.max(0,Math.min(el.scrollWidth-el.clientWidth,base+direction*step));
    el.scrollTo({left:destination.current,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  }
  return <div className="dress-pages" id="dress-examples">
    <div className={"dress-catalogue"+(dragging?" is-dragging":"")} ref={strip} tabIndex={0} role="region" aria-label={dress.galleryLabel} onScroll={measure}
      onKeyDown={event=>{if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();move(event.key==="ArrowRight"?1:-1);}}}
      onWheel={()=>{destination.current=null;}}
      onPointerDown={event=>{destination.current=null;if(event.pointerType==="mouse"&&event.button===0){setDragging(true);drag.current={x:event.clientX,left:event.currentTarget.scrollLeft};event.currentTarget.setPointerCapture(event.pointerId);}}}
      onPointerMove={event=>{if(drag.current)event.currentTarget.scrollLeft=drag.current.left-(event.clientX-drag.current.x);}}
      onPointerUp={()=>{drag.current=null;setDragging(false);}} onPointerCancel={()=>{drag.current=null;setDragging(false);}}>
      {category.images.map((look,index)=><figure key={index} data-active={position===index}>
        <div className="look-photo">
          <div className={"look-frames"+(previous?" look-frames--changing":"")} key={revision} style={{"--look-direction":direction,"--look-delay":Math.min(index,3)*65+"ms"} as React.CSSProperties}>
            {previous?.images[index]&&<img className="look-outgoing" src={previous.images[index].src} alt="" aria-hidden="true" draggable={false}/>}
            <img className="look-incoming" src={look.src} alt={look.alt} loading={previous?"eager":"lazy"} draggable={false}/>
          </div>
        </div>
      </figure>)}

    </div>
    <div className="dress-progress" aria-hidden="true"><span style={{width:((position+1)/category.images.length*100)+"%"}} /></div>
    <div className="dress-gallery-controls">
      <button type="button" aria-label={dress.previous} disabled={atStart} onClick={()=>move(-1)}>←</button>
      <span className="gallery-counter">{String(position+1).padStart(2,"0")} / {String(category.images.length).padStart(2,"0")}</span>
      <button type="button" aria-label={dress.next} disabled={atEnd} onClick={()=>move(1)}>→</button>
    </div>
  </div>;
}
export function DressCode() {
  const [page,setPage]=useState(0);
  const [previous,setPrevious]=useState<Category|null>(null);
  const [revision,setRevision]=useState(0);
  const [direction,setDirection]=useState(1);
  const dress=content.dress;const selected=dress.categories[page];
  function changePage(index:number){
    if(index===page)return;
    setPrevious(selected);setDirection(index===0?-1:1);setRevision(value=>value+1);setPage(index);
  }
  return <section className="dress-chapter chapter" id="dress-code" aria-labelledby="dress-title">
    <header className="chapter-heading"><h2 id="dress-title">{dress.title}</h2><p>{dress.intro}</p></header>
    <div className="page-switch" aria-label="Примеры дресс-кода">{dress.categories.map((category,index)=><button key={category.id} type="button" aria-pressed={page===index} aria-controls="dress-examples" onClick={()=>changePage(index)}>{category.label}</button>)}</div>
    <div className="dress-palette" aria-label="Цвета дресс-кода">{selected.palette.map(color=><span key={color.name}><i style={{backgroundColor:color.color}} aria-hidden="true"/>{color.name}</span>)}</div>
    <Catalogue category={selected} previous={previous} direction={direction} revision={revision}/>
    <div className="dress-guidance" aria-live="polite">{selected.details.map(detail=><p key={detail.title}><strong>{detail.title}</strong>{detail.text}</p>)}</div>
    <p className="dress-note">{selected.note}</p>
    <Watercolor kind="atelier-05" className="dress-watercolor"/>
    <Watercolor kind="atelier-06" className="dress-watercolor-secondary"/>
  </section>;
}
