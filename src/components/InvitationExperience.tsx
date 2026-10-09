"use client";
import { useEffect, useRef, useState } from "react";
import { invitation as content } from "@/content/invitation";

import { OpeningScene } from "./OpeningScene";
import { Hero } from "./Hero";
import { DateSection } from "./DateSection";
import { VenueSection } from "./VenueSection";
import { DressCode } from "./DressCode";
import { GuestList } from "./GuestList";
import { Schedule } from "./Schedule";
import { Questions } from "./Questions";
import { RSVP } from "./RSVP";
const seenKey = "anya-maxim-opening-v1";

export function InvitationExperience() {
  const [opening, setOpening] = useState<boolean | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try { setOpening(sessionStorage.getItem(seenKey) !== "yes"); } catch { setOpening(true); }
  }, []);
  useEffect(() => {
    if(opening !== false) return;
    const main=mainRef.current;if(!main)return;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(motion.matches)return;
    const selector=".wedding-date-section,.wedding-calendar,.venue-chapter,.dress-chapter,.guest-album,.guest-chapter>.chapter-heading,.schedule-chapter>.chapter-heading,.schedule-spread li,.questions-heading,.rsvp-paper,.chapter .watercolor";
    const seen=new WeakSet<Element>();
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("motion-visible");
        const row=entry.target as HTMLElement;
        if(row.matches(".schedule-spread li")){
          const list=row.parentElement!;
          const progress=row===list.lastElementChild?1:Math.min(1,(row.offsetTop+26)/Math.max(1,list.offsetHeight-60));
          const previous=Number(list.dataset.lineProgress||0);
          list.dataset.lineProgress=String(Math.max(previous,progress));
          list.style.setProperty("--line-progress",String(Math.max(previous,progress)));
        }
        observer.unobserve(entry.target);
      }
    }),{threshold:0,rootMargin:"0px 0px 4% 0px"});
    function register(){if(motion.matches)return;main!.querySelectorAll<HTMLElement>(selector).forEach(el=>{
      if(seen.has(el))return;seen.add(el);el.classList.remove("motion-visible");el.classList.add("motion-ready");
      if(el.matches(".schedule-spread li"))el.parentElement!.classList.add("timeline-ready");
      observer.observe(el);
    });}
    register();
    const changes=new MutationObserver(register);changes.observe(main,{childList:true,subtree:true});
    const reduce = () => {if(motion.matches){main.querySelectorAll(".motion-ready,.timeline-ready").forEach(el=>el.classList.remove("motion-ready","timeline-ready"));observer.disconnect();}};
    motion.addEventListener("change",reduce);
    return()=>{observer.disconnect();changes.disconnect();motion.removeEventListener("change",reduce);};
  }, [opening]);
  function complete() {
    try { sessionStorage.setItem(seenKey, "yes"); } catch {}
    setOpening(false);
    window.scrollTo({top: 0, behavior: "instant"});
    requestAnimationFrame(() => mainRef.current?.focus({preventScroll: true}));
  }
  return <>
    {opening === null && <div className="boot" aria-label="Загрузка приглашения">А & М</div>}
    {opening === true && <OpeningScene onComplete={complete} />}
    <main id="top" ref={mainRef} tabIndex={-1} hidden={opening !== false} inert={opening !== false} className="invitation">
      <Hero /><DateSection /><VenueSection /><DressCode /><GuestList /><Schedule /><Questions /><RSVP />
      <footer className="footer"><button onClick={() => {setOpening(true); window.scrollTo({top: 0, behavior: "instant"});}}>Открыть письмо ещё раз ↗</button></footer>
    </main>
    <noscript><p className="noscript">Аня & Максим · {content.date} · Начало в {content.time}. Для интерактивного приглашения включите JavaScript.</p></noscript>
  </>;
}
