"use client";
import {useEffect,useRef} from "react";
import { publicSections as content } from "@/content/public-sections";
import { Watercolor } from "./Watercolor";

export function Schedule() {
  const program = content.schedule;
  const listRef=useRef<HTMLOListElement>(null);
  useEffect(()=>{
    const list=listRef.current;if(!list)return;
    const measure=()=>{const last=list.lastElementChild as HTMLElement|null;if(!last)return;const marker=parseFloat(getComputedStyle(last,"::before").top)||0;list.style.setProperty("--schedule-tail",Math.max(0,last.offsetHeight-marker)+"px");};
    const observer=new ResizeObserver(measure);observer.observe(list);measure();let alive=true;void document.fonts.ready.then(()=>{if(alive)measure();});return()=>{alive=false;observer.disconnect();};
  },[]);
  return <section className="schedule-chapter chapter" id="schedule" aria-labelledby="schedule-title">
    <header className="chapter-heading"><h2 id="schedule-title">{program.title}</h2><p>{program.intro}</p></header>
    <ol className="schedule-spread" ref={listRef}>{program.items.map(item => <li key={item.time}><span className="schedule-time">{item.time}</span><div><h3>{item.title}</h3>{item.detail&&<p>{item.detail}</p>}</div></li>)}</ol>
    <Watercolor kind="atelier-09" className="schedule-watercolor" />
  </section>;
}
