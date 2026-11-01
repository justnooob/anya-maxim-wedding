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
  // Only activeFaqId opens a panel. Pending intent waits for the old panel to
  // finish closing, so two answers never visibly unfold together.
  const pendingFaqId = useRef<string | null>(null);
  const closingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readingAnchor = useRef<{element:HTMLElement;top:number;until:number} | null>(null);
  const anchorFrame = useRef(0);
  useEffect(() => {
    const release = () => { readingAnchor.current = null; cancelAnimationFrame(anchorFrame.current); document.documentElement.removeAttribute('data-faq-reading-anchor'); };
    // User input always takes precedence over preserving the previous click.
    for (const event of ['wheel','touchstart','pointerdown','keydown']) window.addEventListener(event,release,{passive:true});
    return () => { release(); if (closingTimer.current) clearTimeout(closingTimer.current); for (const event of ['wheel','touchstart','pointerdown','keydown']) window.removeEventListener(event,release); };
  }, []);
  useLayoutEffect(() => {
    cancelAnimationFrame(anchorFrame.current);
    function compensate() {
      const anchor = readingAnchor.current;
      if (!anchor || !anchor.element.isConnected) return;
      // Compensate only layout displacement of the clicked row. This never
      // scrolls to an answer or to the section start, and bypasses smooth-scroll.
      const displacement = anchor.element.getBoundingClientRect().top - anchor.top;
      if (Math.abs(displacement) > .5) window.scrollBy({top:displacement,behavior:'instant'});
      if (performance.now() >= anchor.until) {readingAnchor.current = null;document.documentElement.removeAttribute('data-faq-reading-anchor');}
    }
    function preserve(){compensate();if(readingAnchor.current)anchorFrame.current=requestAnimationFrame(preserve);}
    // ResizeObserver runs after the animated grid has laid out, before paint.
    // RAF alone can measure the preceding animation frame and compensate late.
    const observer=new ResizeObserver(compensate);
    const list=readingAnchor.current?.element.closest('.questions-list');
    if(list)observer.observe(list);
    preserve();
    return()=>{observer.disconnect();cancelAnimationFrame(anchorFrame.current);};
  }, [activeFaqId]);
  function handleActivate(id:string,element:HTMLButtonElement,started:number) {
    element.focus({preventScroll:true});
    if ((activeFaqId && activeFaqId !== id) || closingTimer.current) {
      document.documentElement.setAttribute('data-faq-reading-anchor','true');
      readingAnchor.current = {element,top:element.getBoundingClientRect().top,until:started+900};
    }
    toggle(id);
  }
  function toggle(id: string) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (closingTimer.current) clearTimeout(closingTimer.current);
      closingTimer.current = null;
      pendingFaqId.current = null;
      setActiveFaqId(current => current === id ? null : id);
    } else if (closingTimer.current) {
      pendingFaqId.current = pendingFaqId.current === id ? null : id;
    } else if (activeFaqId) {
      pendingFaqId.current = activeFaqId === id ? null : id;
      setActiveFaqId(null);
      closingTimer.current = setTimeout(() => {
        closingTimer.current = null;
        setActiveFaqId(pendingFaqId.current);
        pendingFaqId.current = null;
      }, 420);
    } else setActiveFaqId(id);
  }
  return <section className="questions-chapter chapter" id="questions" aria-labelledby="questions-title">
    <div className="questions-composition">
      <header className="chapter-heading questions-heading">
        <h2 id="questions-title">{questions.title}</h2>
      </header>
      <div className="questions-list">
        {questions.items.map((item,index) => {
          const open = activeFaqId === item.id;
          const triggerId = "question-" + item.id;
          const panelId = "answer-" + item.id;
          return <div className="question-item" key={item.id} style={{'--faq-order':index} as CSSProperties}>
            <h3 className="question-title">
              <button id={triggerId} type="button" className="question-trigger" aria-expanded={open} aria-controls={panelId} onClick={event => handleActivate(item.id,event.currentTarget,event.timeStamp)}>
                <span>{item.question}</span><span className="question-sign" aria-hidden="true">{open ? "−" : "+"}</span>
              </button>
            </h3>
            <div id={panelId} className="question-panel" data-open={open} role="region" aria-labelledby={triggerId} aria-hidden={!open} inert={!open}>
              <div className="question-panel-clip">{[item.answer, ...("additionalParagraphs" in item ? item.additionalParagraphs ?? [] : [])].map((paragraph,index) => <p className="question-answer" key={index}>{answerParts(paragraph)}</p>)}</div>
            </div>
          </div>;
        })}
      </div>
    </div>
    <Watercolor kind="mini" className="questions-watercolor" />
  </section>;
}
