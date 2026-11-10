"use client";
import {Fragment,type MouseEvent} from "react";
import {splitMusicLinks} from "@/content/music-links.mjs";

function openMusicLink(event:MouseEvent<HTMLAnchorElement>,href:string){
 const openLink=window.Telegram?.WebApp?.openLink;
 if(typeof openLink!=="function")return; // In a regular browser, use the anchor.
 event.preventDefault();
 try{openLink(href);}
 catch{window.open(href,"_blank","noopener,noreferrer");}
}

/** Render music requests verbatim, with http(s) links opening outside Mini App. */
export function MusicLinks({text}:{text:string}){
 return <>{splitMusicLinks(text).map((part,index)=>
  part.href
   ? <a key={index} className="organizer-music-link" href={part.href} target="_blank" rel="noopener noreferrer nofollow ugc" onClick={event=>openMusicLink(event,part.href!)}>{part.text}</a>
   : <Fragment key={index}>{part.text}</Fragment>
 )}</>;
}
