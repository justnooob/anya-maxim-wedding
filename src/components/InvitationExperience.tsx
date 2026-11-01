"use client";
import { useEffect, useRef, useState } from "react";
import { invitation as content } from "@/content/invitation";

import {useInvitationMotion} from './useInvitationMotion';
import { OpeningScene } from "./OpeningScene";
import { Hero } from "./Hero";
import { DateSection } from "./DateSection";
import { VenueSection } from "./VenueSection";
import { DressCode } from "./DressCode";
import {WishlistTeaser} from './WishlistTeaser';
import { GuestList } from "./GuestList";
import { Schedule } from "./Schedule";
import { Questions } from "./Questions";
import { RSVP } from "./RSVP";
const seenKey = "anya-maxim-opening-v1";

export function InvitationExperience() {
  const [opening, setOpening] = useState<boolean | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const focusAfterOpening=useRef(false);
  const landingHandled=useRef(false);
  useEffect(()=>{if(opening===false&&focusAfterOpening.current){focusAfterOpening.current=false;mainRef.current?.focus({preventScroll:true});}},[opening]);
  useEffect(()=>{
    if(opening!==false||landingHandled.current)return;
    landingHandled.current=true;
    let target:HTMLElement|null=null;
    try{target=document.getElementById(decodeURIComponent(window.location.hash.slice(1)));}catch{}
    if(!target)return;
    // Native fragment restoration runs while the invitation is still hidden.
    // Restore it once after hydration/fonts, unless the user has already moved.
    let cancelled=false,frame=0;
    const cancel=()=>{cancelled=true;cancelAnimationFrame(frame);};
    const events=['wheel','touchstart','pointerdown','keydown'] as const;
    for(const event of events)window.addEventListener(event,cancel,{passive:true,once:true});
    const restore=()=>{void document.fonts.ready.then(()=>{if(!cancelled)frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{if(!cancelled)target?.scrollIntoView({block:'start',behavior:'instant'});});});});};
    if(document.readyState==='complete')restore();else window.addEventListener('load',restore,{once:true});
    return()=>{cancel();window.removeEventListener('load',restore);for(const event of events)window.removeEventListener(event,cancel);};
  },[opening]);
  useEffect(() => {
    try { setOpening(sessionStorage.getItem(seenKey) !== "yes"); } catch { setOpening(true); }
  }, []);
  useInvitationMotion(mainRef,opening===false);
  function complete() {
    try { sessionStorage.setItem(seenKey, "yes"); } catch {}
    focusAfterOpening.current=true;
    setOpening(false);
    window.scrollTo({top: 0, behavior: "instant"});
  }
  return <>
    {opening === null && <div className="boot" aria-label="Загрузка приглашения">А & М</div>}
    {opening === true && <OpeningScene onComplete={complete} />}
    <main id="top" ref={mainRef} tabIndex={-1} hidden={opening !== false} inert={opening !== false} className="invitation">
      <Hero /><DateSection /><VenueSection /><DressCode /><GuestList /><Schedule /><WishlistTeaser /><Questions /><RSVP />
      <footer className="footer"><button onClick={() => {setOpening(true); window.scrollTo({top: 0, behavior: "instant"});}}>Открыть письмо ещё раз ↗</button></footer>
    </main>
    <noscript><p className="noscript">Аня & Максим · {content.date} · Начало в {content.time}. Для интерактивного приглашения включите JavaScript.</p></noscript>
  </>;
}
