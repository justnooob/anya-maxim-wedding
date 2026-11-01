"use client";
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from "react";
import {createPortal} from "react-dom";
import {publicSections as content} from "@/content/public-sections";
import {type LookExample} from "@/content/dress-code";
import {Watercolor} from "./Watercolor";
import {DressMaterials} from "./DressMaterials";
import {LookStatus} from "./LookStatus";
import {LookbookDialog} from "./LookbookDialog";
import {useDressFloating} from "./useDressFloating";
import {nextLookIndex} from "./dress-navigation.mjs";
type GalleryState={index:number;previous:number|null;travel:number;revision:number};
const emptyGallery:GalleryState={index:0,previous:null,travel:1,revision:0};

function EmphasizedText({text,word}:{text:string;word:string|null}){
 const at=word?text.indexOf(word):-1;
 return at<0?<>{text}</>:<>{text.slice(0,at)}<strong className="dress-jacket-emphasis">{word}</strong>{text.slice(at+word!.length)}</>;
}

function ExampleCarousel({examples,title,id,state,move,onOpen}:{examples:LookExample[];title:string;id:string;state:GalleryState;move:(delta:number)=>void;onOpen:(opener:HTMLElement)=>void}){
 const {index,previous,travel,revision}=state;
 const gesture=useRef<{x:number;y:number}|null>(null),swiped=useRef(false),stage=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const root=stage.current;if(!root)return;const photo=root.querySelector('.lookbook-incoming .lookbook-photo');if(!photo)return;const measure=()=>root.style.setProperty('--look-photo-height',photo.getBoundingClientRect().height+'px');measure();const observer=new ResizeObserver(measure);observer.observe(photo);return()=>observer.disconnect();},[index]);
 const copy=content.dress;
 useLayoutEffect(()=>{
  const root=stage.current;if(!root)return;let lastWidth=0;
  function measure(){
   const description=root!.querySelector<HTMLElement>('.lookbook-incoming .lookbook-description');if(!description)return;
   const clone=description.cloneNode(true) as HTMLElement;
   Object.assign(clone.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',width:description.getBoundingClientRect().width+'px',minHeight:'0',inset:'0 auto auto 0'});clone.setAttribute('aria-hidden','true');clone.inert=true;description.parentElement!.appendChild(clone);
   let height=0;for(const category of copy.categories)for(const page of category.pages)for(const example of (id==='dress-allowed'?page.allowed:page.avoid)){clone.querySelector('.chapter-kicker')!.textContent=(example as LookExample).eyebrow??title;clone.querySelector('h4')!.textContent=example.title;clone.querySelector('p')!.textContent=example.description;height=Math.max(height,clone.getBoundingClientRect().height);}
   clone.remove();root!.style.setProperty('--look-description-height',Math.ceil(height)+'px');
  }
  measure();const observer=new ResizeObserver(()=>{const width=root.getBoundingClientRect().width;if(width!==lastWidth){lastWidth=width;measure();}});observer.observe(root);void document.fonts.ready.then(()=>{if(root.isConnected)measure();});return()=>observer.disconnect();
 },[copy.categories,id,title]);
 function frame(item:LookExample,kind:string){return <div className={"lookbook-frame "+kind}>
  <div className="lookbook-photo"><button className="lookbook-open" type="button" aria-label={copy.viewer.open+' '+item.title} onKeyDown={()=>{swiped.current=false;}} onClick={e=>{if(!swiped.current)onOpen(e.currentTarget);}}
   onPointerDown={e=>{swiped.current=false;gesture.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
   onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(start&&Math.abs(e.clientX-start.x)>40&&Math.abs(e.clientX-start.x)>Math.abs(e.clientY-start.y)){swiped.current=true;move(e.clientX<start.x?1:-1);}}}
   onPointerCancel={()=>{gesture.current=null;}}>
   {item.image?<img src={item.image} alt={item.title} loading="lazy" draggable={false}/>:<div className="lookbook-placeholder"><span aria-hidden="true">А & М</span><p>{copy.placeholder}</p></div>}<LookStatus allowed={item.status==='allowed'}/>
  </button></div>
  <div className="lookbook-description"><span className="chapter-kicker">{item.eyebrow??title}</span><h4>{item.title}</h4><p>{item.description}</p></div>
 </div>;}
 return <section id={id} className="lookbook" aria-labelledby={id+"-title"}>
  <h3 id={id+"-title"}>{title}</h3>
  <div ref={stage} className="lookbook-stage" tabIndex={0} role="region" aria-label={title+": "+copy.galleryLabel} style={{"--look-direction":travel} as CSSProperties}
   onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}}}
   onPointerDown={e=>{if(!(e.target as HTMLElement).closest('button'))gesture.current={x:e.clientX,y:e.clientY};}}
   onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(start&&Math.abs(e.clientX-start.x)>40&&Math.abs(e.clientX-start.x)>Math.abs(e.clientY-start.y)){swiped.current=true;move(e.clientX<start.x?1:-1);}}}
   onPointerCancel={()=>{gesture.current=null;}}>
   <div className="lookbook-frames" key={revision}>
    {previous!==null&&<div aria-hidden="true" inert>{frame(examples[previous],"lookbook-outgoing")}</div>}
    {frame(examples[index],"lookbook-incoming")}
   </div>
   <div className="dress-gallery-controls" onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}><button type="button" aria-label={title+": "+copy.previous} onClick={()=>move(-1)}>←</button><span className="gallery-counter" aria-live="polite">{String(index+1).padStart(2,'0')} / {String(examples.length).padStart(2,'0')}</span><button type="button" aria-label={title+": "+copy.next} onClick={()=>move(1)}>→</button></div>
  </div>
 </section>;
}
export function DressCode(){
 const [page,setPage]=useState(0),[section,setSection]=useState(0),[direction,setDirection]=useState(1);
 const chapter=useRef<HTMLElement>(null),tabs=useRef<HTMLDivElement>(null);
 const [floatingHost,setFloatingHost]=useState<HTMLElement|null>(null);
 // Keep fixed UI outside the chapter's motion transform, but under #top's styles/inert state.
 useEffect(()=>setFloatingHost(document.getElementById('top')),[]);
 const [galleries,setGalleries]=useState<Record<string,GalleryState>>({});
 const [viewer,setViewer]=useState<{group:'allowed'|'avoid';opener:HTMLElement}|null>(null);
 const timers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});
 useEffect(()=>{const running=timers.current;return()=>{Object.values(running).forEach(clearTimeout);};},[]);
 const floating=useDressFloating(chapter,tabs);
 const dress=content.dress,category=dress.categories[page],selected=category.pages[section];
 const gallery=(group:'allowed'|'avoid')=>galleries[selected.id+'-'+group]??{...emptyGallery,travel:direction};
 function move(group:'allowed'|'avoid',delta:number,loop=true){
  const key=selected.id+'-'+group,count=selected[group].length;
  setGalleries(all=>{const old=all[key]??emptyGallery,next=nextLookIndex(old.index,delta,count,loop);if(next===old.index)return all;return {...all,[key]:{index:next,previous:old.index,travel:delta,revision:old.revision+1}};});
  clearTimeout(timers.current[key]);timers.current[key]=setTimeout(()=>setGalleries(all=>all[key]?{...all,[key]:{...all[key],previous:null}}:all),750);
 }
 function changeCategory(i:number){if(i===page)return;setDirection(i===0?-1:1);setPage(i);setSection(0);setGalleries({});}
 function changeSection(i:number){if(i===section)return;setDirection(i>section?1:-1);setSection(i);setGalleries({});}
 useLayoutEffect(()=>{
  const root=chapter.current;if(!root)return;let lastWidth=0;
  function measure(){
   const guidance=root!.querySelector<HTMLElement>('.lookbook-guidance');if(!guidance)return;
   // Measure actual explanatory copy, including the conditional black warning.
   // The image groups are uniform; only their short notes need a shared reserve.
   const clone=guidance.cloneNode(true) as HTMLElement;
   Object.assign(clone.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',width:guidance.getBoundingClientRect().width+'px',minHeight:'0',inset:'0 auto auto 0'});clone.setAttribute('aria-hidden','true');clone.inert=true;guidance.parentElement!.appendChild(clone);
   let height=0;for(const category of dress.categories)for(const item of category.pages){clone.querySelector(':scope > p')!.textContent=item.explanation;(clone.querySelector('.dress-black-warning') as HTMLElement).hidden=item.id!=='men-accessories';height=Math.max(height,clone.getBoundingClientRect().height);}
   clone.remove();root!.style.setProperty('--dress-guidance-height',Math.ceil(height)+'px');
   const notes=root!.querySelector<HTMLElement>('.material-notes');if(!notes)return;
   const noteClone=notes.cloneNode(true) as HTMLElement;Object.assign(noteClone.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',width:notes.getBoundingClientRect().width+'px',minHeight:'0',inset:'0 auto auto 0'});noteClone.inert=true;noteClone.setAttribute('aria-hidden','true');noteClone.querySelector('.dress-black-warning')!.textContent=dress.blackWarning;notes.parentElement!.appendChild(noteClone);
   let noteHeight=0;for(const category of dress.categories)for(const item of category.pages){noteClone.querySelector('p')!.textContent=item.materials;(noteClone.querySelector('.dress-black-warning') as HTMLElement).hidden=item.id!=='men-accessories';noteHeight=Math.max(noteHeight,noteClone.getBoundingClientRect().height);}
   noteClone.remove();root!.style.setProperty('--material-notes-height',Math.ceil(noteHeight)+'px');
  }
  measure();const observer=new ResizeObserver(()=>{const width=root.getBoundingClientRect().width;if(width!==lastWidth){lastWidth=width;measure();}});observer.observe(root);void document.fonts.ready.then(()=>{if(root.isConnected)measure();});return()=>observer.disconnect();
 },[selected.id,dress.categories,dress.blackWarning]);
 return <section ref={chapter} className="dress-chapter chapter" id="dress-code" aria-labelledby="dress-title">
  <header className="chapter-heading"><h2 id="dress-title">{dress.title}</h2><p>{dress.intro}</p></header>
  <div className="dress-notices">
   <p className="dress-help dress-help--primary">{dress.notice}</p>
   <p className="dress-help">{dress.helpBefore}{" "}<a href={dress.helpUrl} target="_blank" rel="noopener noreferrer">{dress.helpLink}</a>{dress.helpAfter}</p>
  </div>
  <div ref={tabs} className="dress-original-tabs"><div className="page-switch" aria-label="Примеры дресс-кода">{dress.categories.map((category,i)=><button key={category.id} type="button" aria-label={category.label} aria-pressed={page===i} aria-controls="dress-examples" onClick={()=>changeCategory(i)}>{category.label}</button>)}</div>
  <div className="page-switch dress-section-switch" aria-label="Одежда и аксессуары">{category.pages.map((item,i)=><button key={item.id} type="button" aria-label={item.label} aria-pressed={section===i} aria-controls="dress-examples" onClick={()=>changeSection(i)}>{item.label}</button>)}</div></div>
  <div id="dress-examples" className="dress-lookbook" key={selected.id} style={{'--look-direction':direction} as CSSProperties}>
   <div className="dress-palette-heading"><h3 className="palette-title">{dress.paletteTitle}</h3>
   <p className="palette-intro">{dress.paletteHint}</p></div>
   <div className="dress-palette dress-palette-families">{selected.paletteFamilies.map(family=><span className={'palette-family palette-family--'+family.id} key={family.id} role="group" aria-label={family.name}>
    <strong className="palette-family-title">{family.name}</strong><small>{family.description}</small>
    <span className="palette-fan">{family.shades.map((shade,i)=><i key={shade.name} className={i===2?'palette-main':''} style={{'--shade':shade.color,'--shade-order':i} as CSSProperties} role="img" aria-label={shade.name} title={shade.name}/>)}</span>
   </span>)}</div>
   <p className="palette-family-hint dress-palette-hint">{dress.familyHint}</p>
   <div className="lookbook-guidance"><p className="dress-family-explanation"><EmphasizedText text={selected.explanation} word={selected.id==='men-clothes'?dress.jacketEmphasis:null}/></p><p className="dress-black-warning" hidden={selected.id!=='men-accessories'}>{dress.blackWarning}</p></div>
   <DressMaterials id={selected.id} title={dress.materialsTitle} groups={selected.materialGroups} description={selected.materials} warning={selected.id==='men-accessories'?dress.blackWarning:null}/>
   <ExampleCarousel examples={selected.allowed} title={dress.allowedTitle} id="dress-allowed" state={gallery('allowed')} move={delta=>move('allowed',delta)} onOpen={opener=>setViewer({group:'allowed',opener})}/>
   <ExampleCarousel examples={selected.avoid} title={dress.avoidTitle} id="dress-avoid" state={gallery('avoid')} move={delta=>move('avoid',delta)} onOpen={opener=>setViewer({group:'avoid',opener})}/>
  </div>
  {floatingHost&&createPortal(<nav className={'dress-floating'+(floating.visible&&floating.expanded&&!viewer?' is-visible':'')} aria-label={dress.floating.label} aria-hidden={!floating.visible||!floating.expanded||!!viewer} inert={!floating.visible||!floating.expanded||!!viewer}>
   <div className="page-switch" aria-label={dress.floating.gendersLabel}>{dress.categories.map((item,i)=><button type="button" key={item.id} aria-pressed={page===i} aria-controls="dress-examples" onClick={()=>changeCategory(i)}>{item.label}</button>)}</div>
   <div className="page-switch dress-section-switch" aria-label={dress.floating.pagesLabel}>{category.pages.map((item,i)=><button type="button" key={item.id} aria-pressed={section===i} aria-controls="dress-examples" onClick={()=>changeSection(i)}>{item.label}</button>)}</div>
  </nav>,floatingHost)}
  {viewer&&<LookbookDialog examples={selected[viewer.group]} index={gallery(viewer.group).index} allowed={viewer.group==='allowed'} onMove={delta=>move(viewer.group,delta,false)} onClose={()=>setViewer(null)} opener={viewer.opener}/>}
  <Watercolor kind="atelier-05" className="dress-watercolor"/><Watercolor kind="atelier-06" className="dress-watercolor-secondary"/>
 </section>;
}
