"use client";
import { useEffect, useRef, useState } from "react";
import { Watercolor } from "./Watercolor";
import { publicSections as content } from "@/content/public-sections";

export function VenueSection() {
  const venue = content.venue;
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number|null>(null);
  const [direction, setDirection] = useState(1);
  const [running, setRunning] = useState(true);
  const [visible, setVisible] = useState(false);
  const [revision, setRevision] = useState(0);
  const deadline = useRef(0);
  const gallery = useRef<HTMLDivElement>(null);
  const gesture = useRef<{x:number;y:number}|null>(null);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) setRunning(false);
    const observer = new IntersectionObserver(entries => setVisible(entries[0].isIntersecting), {threshold:.15});
    if (gallery.current) observer.observe(gallery.current);
    const refresh = () => setRevision(value => value + 1);
    document.addEventListener("visibilitychange", refresh);
    return () => {observer.disconnect();document.removeEventListener("visibilitychange", refresh);};
  }, []);
  useEffect(() => {
    if (!running || !visible || document.hidden) return;
    // Each manual interaction restarts a full ten-second quiet period.
    const delay = Math.max(venue.autoInterval, deadline.current - Date.now());
    const timer = window.setTimeout(() => {setPrevious(index);setDirection(1);setIndex((index+1)%venue.images.length);}, delay);
    return () => window.clearTimeout(timer);
  }, [index, running, visible, revision, venue.autoInterval, venue.images.length]);
  function select(value:number) {
    deadline.current = Date.now() + venue.manualPause;
    setPrevious(index);setDirection(value>=index?1:-1);
    setIndex((value + venue.images.length) % venue.images.length);
    setRevision(value => value + 1);
  }
  const photo = venue.images[index];
  return <section className="venue-chapter chapter" id="venue" aria-labelledby="venue-title">
    <div className="venue-photo venue-gallery" ref={gallery} role="region" aria-label={venue.galleryLabel} tabIndex={0}
      onKeyDown={event => {if(event.key === "ArrowRight" || event.key === "ArrowLeft") {event.preventDefault();select(index + (event.key === "ArrowRight" ? 1 : -1));}}}
      onPointerDown={event => {if(event.button === 0) {gesture.current={x:event.clientX,y:event.clientY};deadline.current=Date.now()+venue.manualPause;setRevision(value=>value+1);}}}
      onPointerUp={event => {const start=gesture.current;gesture.current=null;if(start&&Math.abs(event.clientX-start.x)>45&&Math.abs(event.clientX-start.x)>Math.abs(event.clientY-start.y))select(index+(event.clientX<start.x?1:-1));}}
      onPointerCancel={()=>{gesture.current=null;}}>
      <div className={"venue-frames venue-frames--"+(direction>0?"next":"previous")} key={index}>
        {previous!==null && previous!==index && <img className="venue-outgoing-photo" src={venue.images[previous].src} alt="" aria-hidden="true" draggable={false} />}
        <img className={"venue-current-photo"+(previous!==null&&previous!==index?" venue-incoming-photo":"")} src={photo.src} alt={photo.alt} loading="lazy" draggable={false} />
      </div>
      <img className="venue-preload" src={venue.images[(index+1)%venue.images.length].src} alt="" aria-hidden="true" loading="lazy" />
      <div className="venue-gallery-controls">
        <button type="button" aria-label={venue.previous} onClick={()=>select(index-1)}>←</button>
        <span className="gallery-counter" aria-live={running?"off":"polite"}>{String(index+1).padStart(2,"0")} / {String(venue.images.length).padStart(2,"0")}</span>
        <button type="button" aria-label={venue.next} onClick={()=>select(index+1)}>→</button>
      </div>
    </div>
    <div className="venue-copy">
      <span className="chapter-kicker">{venue.eyebrow}</span><h2 id="venue-title">{venue.title}</h2>
      <p className="venue-name">{venue.name}</p><p className="venue-address">{venue.address}</p>
      <div className="venue-arrival"><p>{venue.parking}</p><span aria-hidden="true">/</span><p>{venue.overnight}</p></div>
      <a className="foil-button" href={venue.mapUrl} target="_blank" rel="noopener noreferrer"><span>{venue.mapLabel}</span><span aria-hidden="true">→</span></a>
      <Watercolor kind="atelier-03" className="venue-watercolor" />
      <Watercolor kind="atelier-04" className="venue-watercolor-secondary" />
    </div>
  </section>;
}
