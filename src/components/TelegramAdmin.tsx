"use client";
import Script from "next/script";
import {useRef,useState} from "react";
import {boundedJson,requestMessage} from '@/client/requests.mjs';
const accessOnly="Эта страница доступна только организаторам через Telegram.";
class AdminRequestError extends Error{constructor(public status:number){super(status===401||status===403?accessOnly:requestMessage(status));}}
type Guest={id:string;status:"GOING"|"NOT_GOING";fields:{label:string;value:string}[]};
type Stats={total:number;going:number;not_going:number;transfer:number;overnight:number};
declare global{interface Window{Telegram?:{WebApp:{initData:string;ready:()=>void;expand:()=>void;safeAreaInset?:{top:number;bottom:number};contentSafeAreaInset?:{top:number;bottom:number}}}}}
export function TelegramAdmin(){
 const [guests,setGuests]=useState<Guest[]>([]),[stats,setStats]=useState<Stats|null>(null),[selected,setSelected]=useState<Guest|null>(null),[filter,setFilter]=useState("all"),[offset,setOffset]=useState(0),[more,setMore]=useState(false),[confirmation,setConfirmation]=useState(""),[message,setMessage]=useState(accessOnly),[busy,setBusy]=useState(false);
 const active=useRef(false);
 const [safeArea,setSafeArea]=useState({top:0,bottom:0});
 const [authorized,setAuthorized]=useState(false);
 function deny(){setAuthorized(false);setGuests([]);setStats(null);setSelected(null);setConfirmation("");setMore(false);setOffset(0);setMessage(accessOnly); }
 async function api(path:string,body?:object){
  const initData=window.Telegram?.WebApp.initData;if(!initData){deny();throw new AdminRequestError(403);}
  const {response:res,result:data}=await boundedJson("/api/telegram/mini-app"+path,{method:body?"POST":"GET",cache:"no-store",headers:{"X-Telegram-Init-Data":initData,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!res.ok){if(res.status===401||res.status===403)deny();throw new AdminRequestError(res.status);}return data;
 }
 async function reload(nextFilter=filter,nextOffset=offset){
  let data=await api('?filter='+nextFilter+'&offset='+nextOffset);
  while(nextOffset>0&&data.guests.length===0){nextOffset=Math.max(0,nextOffset-20);data=await api('?filter='+nextFilter+'&offset='+nextOffset);}
  setAuthorized(true);setGuests(data.guests);setStats(data.stats);setMore(data.hasMore);setFilter(nextFilter);setOffset(nextOffset);
 }
 const friendly=(error:unknown)=>error instanceof AdminRequestError?error.message:requestMessage(503);
 async function load(nextFilter=filter,nextOffset=offset){if(active.current)return;active.current=true;setBusy(true);try{await reload(nextFilter,nextOffset);setMessage('');}catch(error){setMessage(friendly(error));}finally{active.current=false;setBusy(false);}}
 async function open(id:string){if(active.current)return;active.current=true;setBusy(true);try{const data=await api('?id='+id);setSelected(data.guest);setConfirmation('');setMessage('');}catch(error){if(error instanceof AdminRequestError&&error.status===404){setSelected(null);await reload().catch(()=>{});}setMessage(friendly(error));}finally{active.current=false;setBusy(false);}}
 async function remove(){if(!selected||active.current)return;active.current=true;setBusy(true);try{const data=await api('',confirmation?{action:'confirm',token:confirmation}:{action:'delete',id:selected.id});setMessage(data.message);if(data.confirmation)setConfirmation(data.confirmation);else{setSelected(null);setConfirmation('');await reload();setMessage(data.message);}}catch(error){setMessage(friendly(error));}finally{active.current=false;setBusy(false);}}
 async function cancel(){if(active.current)return;active.current=true;setBusy(true);try{await api('',{action:'cancel',token:confirmation});setConfirmation('');setMessage('Удаление отменено.');}catch(error){setMessage(friendly(error));}finally{active.current=false;setBusy(false);}}
 return <main className="telegram-admin" aria-busy={busy} style={{"--telegram-safe-top":safeArea.top+"px","--telegram-safe-bottom":safeArea.bottom+"px"} as React.CSSProperties}><Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onReady={()=>{const app=window.Telegram?.WebApp;if(!app?.initData){deny();return;}app.ready();app.expand();setSafeArea({top:(app?.safeAreaInset?.top||0)+(app?.contentSafeAreaInset?.top||0),bottom:app?.safeAreaInset?.bottom||0});void load();}} onError={()=>{deny();}} />
 <p className="quiet-note">Anya & Maxim · Для организаторов</p>
 {message&&<p role="status" className="quiet-note">{message}</p>}
 {authorized&&<><header><h1>Наши гости</h1></header>
 {stats&&<p className="admin-counts">Ответов {stats.total} · Придут {stats.going} · Не придут {stats.not_going}<br/>Трансфер {stats.transfer} · Ночёвка {stats.overnight}</p>}
 {selected?<article className="rsvp-paper admin-detail"><button className="paper-link" disabled={busy} onClick={()=>{setSelected(null);setConfirmation("");setMessage("");}}>← К списку</button><h2>{selected.fields[0].value}</h2><p>{selected.status==="GOING"?"Придёт":"Не придёт"}</p><dl>{selected.fields.slice(1).map(field=><div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl><button className="paper-link admin-delete" disabled={busy} onClick={()=>void remove()}>{confirmation?"Подтвердить удаление":"Удалить ответ"}</button>{confirmation&&<button className="paper-link" disabled={busy} onClick={()=>void cancel()}>Отмена</button>}</article>:<><nav className="admin-filters" aria-label="Фильтр ответов">{[["all","Все"],["yes","Придут"],["no","Не придут"],["transfer","Трансфер"],["overnight","Ночёвка"]].map(([value,label])=><button className="paper-link" key={value} aria-pressed={filter===value} disabled={busy} onClick={()=>void load(value,0)}>{label}</button>)}</nav><div className="admin-guests">{guests.map(guest=><button key={guest.id} onClick={()=>void open(guest.id)} disabled={busy}><span>{guest.fields[0].value}</span><small>{guest.status==="GOING"?"Придёт":"Не придёт"}</small>{guest.fields.find(field=>field.label==="Музыка")&&<small className="admin-music">Музыка: {guest.fields.find(field=>field.label==="Музыка")?.value}</small>}</button>)}</div>{stats&&guests.length===0&&<p className="quiet-note">Пока нет ответов.</p>}<div className="admin-filters">{offset>0&&<button className="paper-link" disabled={busy} onClick={()=>void load(filter,offset-20)}>Назад</button>}{more&&<button className="paper-link" disabled={busy} onClick={()=>void load(filter,offset+20)}>Дальше</button>}<button className="paper-link" disabled={busy} onClick={()=>void load()}>Обновить</button></div></>}
 </>}
 </main>;
}
