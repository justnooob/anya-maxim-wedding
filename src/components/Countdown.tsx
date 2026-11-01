"use client";
import {useEffect,useState,type CSSProperties} from 'react';
import {calendarCountdown,russianUnit} from '@/client/countdown.mjs';
import {countdownCopy as copy} from '@/content/countdown.mjs';
type Remaining=ReturnType<typeof calendarCountdown>;
export function Countdown({targetISO}:{targetISO:string}){
 const [remaining,setRemaining]=useState<Remaining|null>(null);
 useEffect(()=>{
  const target=Date.parse(targetISO);let timer:ReturnType<typeof setInterval>|undefined;
  const stop=()=>{if(timer!==undefined){clearInterval(timer);timer=undefined;}};
  const tick=()=>{const value=calendarCountdown(Date.now(),target);setRemaining(value);if(value.finished)stop();};
  const resume=()=>{stop();tick();if(!document.hidden&&Date.now()<target)timer=setInterval(tick,1000);};
  resume();document.addEventListener('visibilitychange',resume);window.addEventListener('pageshow',resume);
  return()=>{stop();document.removeEventListener('visibilitychange',resume);window.removeEventListener('pageshow',resume);};
 },[targetISO]);
 return <div className="wedding-countdown" role="timer" aria-live="off" aria-label={copy.accessible} data-ready={remaining!==null} data-finished={remaining?.finished??false}>
  <p className="countdown-heading">{remaining?.finished?copy.finished:copy.before}</p>
  <ol>{copy.units.map((unit,index)=>{const value=remaining?.[unit.key as keyof Omit<Remaining,'finished'>]??0;return <li key={unit.key} style={{'--unit-order':index} as CSSProperties} data-countdown-unit={unit.key}><span className="countdown-number">{String(value).padStart(2,'0')}</span><span className="countdown-unit">{russianUnit(value,unit.forms)}</span></li>;})}</ol>
 </div>;
}
