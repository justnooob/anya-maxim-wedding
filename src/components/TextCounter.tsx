import {rsvpLimits,textLength} from '@/content/rsvp-limits.mjs';
export function TextCounter({field,value}:{field:'food'|'musicRequest';value:string}){
 const count=textLength(value),max=rsvpLimits[field];
 return <small id={field+'-counter'} className={'text-counter'+(count>=max*.9?' near-limit':'')} aria-live="polite">{count} / {max}</small>;
}
