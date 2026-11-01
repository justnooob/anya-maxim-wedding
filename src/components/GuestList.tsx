"use client";
import { useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { Watercolor } from "./Watercolor";
import { mockGuests, type MockGuest } from "@/content/guests.mock";
import { publicSections as content } from "@/content/public-sections";
import {familySides} from "@/content/family-sides.mjs";
import {familySwipeTarget} from "@/client/family-swipe.mjs";

type FamilySide = keyof typeof familySides;
const compactQuery = "(max-width: 1000px)";
function subscribeCompact(notify:()=>void){const media=window.matchMedia(compactQuery);media.addEventListener("change",notify);return()=>media.removeEventListener("change",notify);}
function compactSnapshot(){return window.matchMedia(compactQuery).matches;}
const serverSnapshot=()=>false;
function guestCard(guest:MockGuest,index:number){return <figure className={"guest-print guest-print--" + index % 4+(guest.realPortrait?" guest-print--approved":"")} key={guest.id} data-guest-id={guest.id}>
  <div className="guest-photo"><img src={guest.image} alt={guest.realPortrait?`${guest.name}, ${guest.description.toLowerCase()}`:"Временный портрет гостя: " + guest.name} style={{objectPosition:guest.portraitPosition}} loading="lazy" draggable={guest.group==="family"?false:undefined} /></div>
  <figcaption><h3 className={guest.name.split(" ").some(word=>word.length>11)?"guest-name-long":undefined}>{guest.name.split(" ").some(word=>word.length>11)?<>{guest.name.split(" ").slice(0,-1).join(" ")}{" "}<span className="guest-name-tail">{guest.name.split(" ").at(-1)}</span></>:guest.name}</h3><p>{guest.description}</p></figcaption>
</figure>;}

export function GuestList() {
  const [group, setGroup] = useState<"family" | "friends">("family");
  const [side,setSide]=useState<FamilySide>("groom");
  const compact=useSyncExternalStore(subscribeCompact,compactSnapshot,serverSnapshot);
  const gesture=useRef<{id:number;x:number;y:number}|null>(null);
  function start(event:PointerEvent<HTMLDivElement>){if(!compact||!event.isPrimary||(event.pointerType==="mouse"&&event.button!==0))return;gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY};try{event.currentTarget.setPointerCapture(event.pointerId);}catch{}}
  function end(event:PointerEvent<HTMLDivElement>){const point=gesture.current;gesture.current=null;if(!compact||!point||point.id!==event.pointerId)return;const next=familySwipeTarget(side,event.clientX-point.x,event.clientY-point.y);if(next)setSide(next);}
  const guests = mockGuests.filter(guest => guest.group === group);
  const copy = content.guests;
  return <section className="guest-chapter chapter" id="guests" aria-labelledby="guests-title">
    <header className="chapter-heading"><h2 id="guests-title">{copy.title}</h2><p>{copy.intro}</p></header>
    <div className="page-switch" aria-label="Наши гости"><button type="button" aria-pressed={group === "family"} aria-controls="guest-album" onClick={() => setGroup("family")}>{copy.family}<small>{mockGuests.filter(guest=>guest.group==="family").length}</small></button><button type="button" aria-pressed={group === "friends"} aria-controls="guest-album" onClick={() => setGroup("friends")}>{copy.friends}<small>{mockGuests.filter(guest=>guest.group==="friends").length}</small></button></div>
    {group==="family"?<>
      <div className="page-switch family-switch" role="group" aria-label="Сторона семьи">{(["groom","bride"] as const).map(id=><button key={id} type="button" aria-label={familySides[id].label} aria-pressed={side===id} aria-controls={"relatives-"+id} onClick={()=>setSide(id)}>{familySides[id].label}</button>)}</div>
      <div className="family-spread" id="guest-album" data-family-side={side} onPointerDown={start} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;}}>
        {(["groom","bride"] as const).map(id=><section className="family-side" id={"relatives-"+id} key={id} data-active={side===id} aria-labelledby={"family-title-"+id} aria-hidden={compact&&side!==id?true:undefined} inert={compact&&side!==id}>
          <div className="family-anchor-card">{guestCard({...familySides[id].couple,group:'family'},0)}</div>
          <h3 className="family-side-title" id={"family-title-"+id}>{familySides[id].title}</h3>
          <div className="guest-album page-enter">{familySides[id].guestIds.map((guestId,index)=>guestCard(mockGuests.find(guest=>guest.id===guestId)!,index))}</div>
        </section>)}
      </div>
    </>:<div className="guest-album page-enter" id="guest-album" key="friends">{guests.map(guestCard)}</div>}
    <Watercolor kind="atelier-07" className="guest-watercolor-top" />
    <Watercolor kind="atelier-08" className="guest-watercolor-bottom" />
  </section>;
}
