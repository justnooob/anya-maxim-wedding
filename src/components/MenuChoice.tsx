"use client";

import Image from "next/image";
import {createPortal} from "react-dom";
import {useEffect,useId,useRef,useState} from "react";
import {banquetMenu,menuHint} from "@/content/menu.mjs";
import {RequiredMark} from "./RequiredMark";

type MenuKind="hotAppetizer"|"mainCourse";
type Props={kind:MenuKind;value:string;onChange:(value:string)=>void;disabled?:boolean;required?:boolean};

/** Select an option directly from its corner control or from the preview dialog. Stable IDs are retained. */
export function MenuChoice({kind,value,onChange,disabled=false,required=false}:Props){
  const menu=banquetMenu[kind];
  const [opened,setOpened]=useState<string|null>(null);
  const option=menu.options.find(item=>item.id===opened);
  const titleId=useId();
  const dialogRef=useRef<HTMLDivElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);
  const triggerRef=useRef<HTMLButtonElement|null>(null);

  useEffect(()=>{
    if(!option)return;
    const oldOverflow=document.body.style.overflow;
    const oldRootOverflow=document.documentElement.style.overflow;
    document.body.style.overflow="hidden";
    document.documentElement.style.overflow="hidden";
    closeRef.current?.focus({preventScroll:true});
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        event.preventDefault();
        setOpened(null);
      }else if(event.key==="Tab"){
        const focusable=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )??[]).filter(element=>element.getClientRects().length>0);
        if(!focusable.length){
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }
        const first=focusable[0],last=focusable[focusable.length-1];
        if(event.shiftKey&&(document.activeElement===first||!dialogRef.current?.contains(document.activeElement))){
          event.preventDefault();
          last.focus();
        }else if(!event.shiftKey&&(document.activeElement===last||!dialogRef.current?.contains(document.activeElement))){
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown",onKeyDown);
    return ()=>{
      document.removeEventListener("keydown",onKeyDown);
      document.body.style.overflow=oldOverflow;
      document.documentElement.style.overflow=oldRootOverflow;
      const origin=triggerRef.current;
      if(origin?.isConnected)origin.focus({preventScroll:true});
    };
  },[option]);

  return <>
    <fieldset className="paper-options menu-choice menu-card-choice" data-menu-kind={kind} disabled={disabled}>
      <legend>{menu.title}{required&&<RequiredMark/>}</legend>
      <p className="quiet-note">{menuHint}</p>
      <div className="menu-card-grid">
        {menu.options.map(item=>{
          const selected=value===item.id;
          return <div key={item.id} className="menu-card-entry">
            <button
            className="menu-card"
            type="button"
            name={kind}
            data-menu-option={item.id}
            aria-pressed={selected}
            aria-haspopup="dialog"
            aria-label={"Посмотреть: "+item.label+(selected?", выбрано":"")}
            disabled={disabled}
            onClick={event=>{triggerRef.current=event.currentTarget;setOpened(item.id);}}
          >
            <span className="menu-card-photo">
              <Image src={item.image} alt="" width={720} height={720} sizes="(max-width: 699px) 86vw, 290px"/>
            </span>
            <span className="menu-card-caption">
              <span className="menu-card-name">{item.label}</span>
              <span className="menu-card-hint">{selected?"✓ Выбрано":"Посмотреть блюдо"}</span>
            </span>
            </button>
            <span className="menu-card-check-wrap">
              <input type="radio" className="menu-card-check-input"
                name={kind} value={item.id} checked={selected} disabled={disabled}
                onChange={()=>onChange(item.id)} aria-label={"Выбрать: "+item.label} />
              <span className="menu-card-check-indicator" aria-hidden="true">✓</span>
            </span>
          </div>;
        })}
      </div>
    </fieldset>
    {option&&typeof document!=="undefined"&&createPortal(
      <div className="menu-preview-backdrop" onClick={event=>{if(event.target===event.currentTarget)setOpened(null);}}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="menu-preview-dialog">
          <button ref={closeRef} type="button" className="menu-preview-close" onClick={()=>setOpened(null)} aria-label="Закрыть просмотр блюда">×</button>
          <div className="menu-preview-photo">
            <Image src={option.fullImage} alt={option.label} width={1024} height={1024} sizes="(max-width: 700px) 94vw, 630px" loading="eager"/>
          </div>
          <div className="menu-preview-footer">
            <h3 id={titleId}>{option.label}</h3>
            <button type="button" className="menu-preview-select" onClick={()=>{onChange(option.id);setOpened(null);}}>
              Выбрать это блюдо
            </button>
          </div>
        </div>
      </div>,document.body
    )}
  </>;
}
