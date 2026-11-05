"use client";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { questions } from "@/content/questions";
import {Motya} from "./Motya";
import { Watercolor } from "./Watercolor";
type AnswerPart = (typeof questions.items)[number]["answer"][number];
function answerParts(parts: AnswerPart[]) {
  return parts.map((part,index)=>"action" in part && part.action==="motya" ? <Motya key={index}/> : "href" in part && part.href
    ? <a className="question-link" key={index} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>
    : "placeholder" in part && part.placeholder
      ? <span className="question-link question-link-pending" key={index} title="Ссылка на вишлист появится позже">{part.text}</span>
      : <span key={index}>{part.text}</span>);
}

export function Questions() {
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  const listRef=useRef<HTMLDivElement>(null);
  const pendingFaqId=useRef<string|null>(null);
  const closingTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const anchorTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const readingAnchor=useRef<{element:HTMLElement;top:number}|null>(null);
  function releaseAnchor(){readingAnchor.current=null;document.documentElement.removeAttribute('data-faq-reading-anchor');if(anchorTimer.current)clearTimeout(anchorTimer.current);}
  useEffect(()=>{
    for(const event of ['wheel','touchstart','pointerdown','keydown'])window.addEventListener(event,releaseAnchor,{passive:true});
    return()=>{releaseAnchor();if(closingTimer.current)clearTimeout(closingTimer.current);for(const event of ['wheel','touchstart','pointerdown','keydown'])window.removeEventListener(event,releaseAnchor);};
  },[]);
  useLayoutEffect(()=>{
    // One pre-paint observer owns compensation. A second RAF controller used
    // to measure an older animation frame and fight both layout and Safari.
    const observer=new ResizeObserver(()=>{
      const anchor=readingAnchor.current;if(!anchor?.element.isConnected)return;
      const target=window.scrollY+anchor.element.getBoundingClientRect().top-anchor.top;
      if(Math.abs(target-window.scrollY)>.5)window.scrollTo({top:target,behavior:'instant'});
    });
    if(listRef.current)observer.observe(listRef.current);
    return()=>observer.disconnect();
  },[]);
  function finishClosing(){
    if(!closingTimer.current)return;
    clearTimeout(closingTimer.current);closingTimer.current=null;
    setActiveFaqId(pendingFaqId.current);pendingFaqId.current=null;
  }
  function handleActivate(id:string,element:HTMLButtonElement){
    element.focus({preventScroll:true});
    if((activeFaqId&&activeFaqId!==id)||closingTimer.current){
      document.documentElement.setAttribute('data-faq-reading-anchor','true');
      readingAnchor.current={element,top:element.getBoundingClientRect().top};
      if(anchorTimer.current)clearTimeout(anchorTimer.current);
      anchorTimer.current=setTimeout(releaseAnchor,1400);
    }
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      if(closingTimer.current)clearTimeout(closingTimer.current);
      closingTimer.current=null;pendingFaqId.current=null;
      setActiveFaqId(current=>current===id?null:id);
    }else if(closingTimer.current){pendingFaqId.current=pendingFaqId.current===id?null:id;}
    else if(activeFaqId){
      pendingFaqId.current=activeFaqId===id?null:id;
      const panel=document.getElementById('answer-'+activeFaqId);
      const duration=parseFloat(panel?getComputedStyle(panel).transitionDuration:'0.46')*1000;
      setActiveFaqId(null);
      // transitionend is authoritative; the computed-duration timeout only
      // handles interrupted transitions, background tabs and zero-size panels.
      closingTimer.current=setTimeout(finishClosing,duration+80);
    }else setActiveFaqId(id);
  }
  return <section className="questions-chapter chapter" id="questions" aria-labelledby="questions-title">
    <div className="questions-composition">
      <header className="chapter-heading questions-heading">
        <h2 id="questions-title">{questions.title}</h2>
      </header>
      <div className="questions-list" ref={listRef}>
        {questions.items.map((item,index) => {
          const open = activeFaqId === item.id;
          const triggerId = "question-" + item.id;
          const panelId = "answer-" + item.id;
          return <div className="question-item" key={item.id} style={{'--faq-order':index} as CSSProperties}>
            <h3 className="question-title">
              <button id={triggerId} type="button" className="question-trigger" aria-expanded={open} aria-controls={panelId} onClick={event => handleActivate(item.id,event.currentTarget)}>
                <span>{item.question}</span><span className="question-sign" aria-hidden="true">{open ? "−" : "+"}</span>
              </button>
            </h3>
            <div onTransitionEnd={event=>{if(event.target===event.currentTarget&&event.propertyName==='grid-template-rows'&&!open)finishClosing();}} id={panelId} className="question-panel" data-open={open} role="region" aria-labelledby={triggerId} aria-hidden={!open} inert={!open}>
              <div className="question-panel-clip">{[item.answer, ...("additionalParagraphs" in item ? item.additionalParagraphs ?? [] : [])].map((paragraph,index) => <p className="question-answer" key={index}>{answerParts(paragraph)}</p>)}</div>
            </div>
          </div>;
        })}
      </div>
    </div>
    <Watercolor kind="mini" className="questions-watercolor" />
  </section>;
}
