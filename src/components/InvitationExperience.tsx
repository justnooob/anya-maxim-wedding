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
    const selector=".date-invitation,.date-large,.date-start,.wedding-calendar,.chapter-heading,.venue-gallery,.venue-copy,.page-switch,.dress-palette,.dress-pages,.dress-guidance,.dress-note,.guest-print,.guest-note,.schedule-spread li,.schedule-note,.rsvp-paper,.footer,.chapter .watercolor,.calendar-leaves";
    const seen=new WeakSet<Element>();
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("motion-visible");observer.unobserve(entry.target);}
    }),{threshold:0,rootMargin:"0px 0px -8% 0px"});
    function register(){main!.querySelectorAll<HTMLElement>(selector).forEach((el,index)=>{
      if(seen.has(el))return;seen.add(el);el.classList.remove("motion-visible");el.classList.add("motion-ready");
      el.style.setProperty("--motion-delay",(index%4)*85+"ms");observer.observe(el);
    });}
    register();
    const changes=new MutationObserver(register);changes.observe(main,{childList:true,subtree:true});
    return()=>{observer.disconnect();changes.disconnect();};
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
    <main id="top" ref={mainRef} tabIndex={-1} hidden={opening !== false} className="invitation">
      <Hero /><DateSection /><VenueSection /><DressCode /><GuestList /><Schedule /><Questions /><RSVP />
      <footer className="footer"><button onClick={() => {setOpening(true); window.scrollTo({top: 0, behavior: "instant"});}}>Открыть письмо ещё раз ↗</button></footer>
    </main>
    <noscript><p className="noscript">Аня & Максим · {content.date} · Начало в {content.time}. Для интерактивного приглашения включите JavaScript.</p></noscript>
  </>;
}
