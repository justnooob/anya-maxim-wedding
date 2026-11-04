"use client";
import {useState} from 'react';
import {boundedJson} from '@/client/requests.mjs';

type PlanItem={seedKey:string;title:string;status:string;reason?:string};
type PlanOutcome={mode:string;created:number;skipped:number;blocked:number;items:PlanItem[]};
type PlanResponse={outcome:PlanOutcome;previewId?:string;canApply?:boolean;imported?:boolean};

export function WishlistApprovedImport({onImported}:{onImported:()=>Promise<void>|void}){
 const [preview,setPreview]=useState<PlanResponse|null>(null);
 const [applied,setApplied]=useState<PlanResponse|null>(null);
 const [busy,setBusy]=useState(false);
 const [approved,setApproved]=useState(false);
 const [error,setError]=useState('');
 async function send(action:'preview'|'apply',id?:string){
  const initData=window.Telegram?.WebApp.initData;
  if(!initData)throw new Error('Открой админку через Telegram.');
  const {response,result}=await boundedJson('/api/telegram/wishlist/approved-import',{
   method:'POST',cache:'no-store',
   headers:{'X-Telegram-Init-Data':initData,'Content-Type':'application/json'},
   body:JSON.stringify(action==='preview'?{action}:{action,previewId:id,confirm:'IMPORT_19_HIDDEN_DRAFTS'})
  });
  if(!response.ok)throw new Error(result.error||'Не удалось выполнить импорт.');
  return result as PlanResponse;
 }
 async function run(action:'preview'|'apply'){
  if(busy||action==='apply'&&(!preview?.canApply||!approved))return;
  setBusy(true);setError('');
  try{
   if(action==='preview'){
    const data=await send('preview');setPreview(data);setApproved(false);setApplied(null);
   }else{
    const data=await send('apply',preview?.previewId);setApplied(data);setPreview(null);setApproved(false);
    await onImported();
   }
  }catch(err){
   setError(err instanceof Error?err.message:'Не удалось проверить подарки.');
   if(action==='apply'){setPreview(null);setApproved(false);}
  }finally{setBusy(false);}
 }
 const outcome=applied?.outcome||preview?.outcome;
 const createCount=outcome?.items.filter(x=>x.status==='WOULD CREATE HIDDEN DRAFT').length||0;
 return <section className="wishlist-approved-import" aria-label="Импорт выбранных подарков">
  <h3>Новые 19 подарков</h3>
  <p className="organizer-muted">Сначала сравним выбранные подарки с живой базой. Совпадения и удалённые записи не меняем. Новые карточки добавляем только как скрытые черновики.</p>
  {!applied&&<button type="button" disabled={busy} onClick={()=>void run('preview')}>{busy?'Проверяем…':preview?'Обновить проверку':'Проверить импорт 19 подарков'}</button>}
  {outcome&&<div role="status" className="wishlist-approved-import-report">
   {applied?<p><strong>Импорт завершён.</strong> Создано скрытых карточек: {outcome.created}. Пропущено совпадений: {outcome.skipped}.</p>:
    <p>Будет добавлено: <strong>{createCount}</strong>. Уже есть или удалено: <strong>{outcome.skipped}</strong>. Не прошли проверку: <strong>{outcome.blocked}</strong>.</p>}
   <details><summary>Показать результат по каждому подарку</summary><ol>{outcome.items.map(item=><li key={item.seedKey}><strong>{item.title}</strong> — {item.status==='WOULD CREATE HIDDEN DRAFT'?'Новый скрытый подарок':item.status==='SKIP ARCHIVED'?'Был удалён, не восстанавливаем':item.status==='SKIP ALREADY EXISTS'?'Уже существует, не меняем':item.status==='CREATED HIDDEN DRAFT'?'Добавлен скрытым':item.status==='BLOCKED REVIEW'?'Заблокирован':item.status}{item.reason?' ('+item.reason+')':''}</li>)}</ol></details>
  </div>}
  {preview?.canApply&&outcome?.blocked===0&&!applied&&<div className="wishlist-approved-import-confirm">
   <label><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>Проверил список. Добавить только отсутствующие подарки как скрытые черновики.</label>
   <button type="button" className="organizer-primary" disabled={busy||!approved} onClick={()=>void run('apply')}>{busy?'Добавляем…':`Добавить ${createCount} скрытых подарков`}</button>
  </div>}
  {preview&&!preview.canApply&&!applied&&<p className="organizer-muted">Импорт недоступен: либо все подарки уже добавлены, либо остались непроверенные позиции.</p>}
  {applied&&<p className="organizer-muted">Теперь открой фильтр «Черновики», просмотри фотографии и опубликуй только те карточки, которые устраивают.</p>}
  {error&&<p role="alert" className="organizer-message">{error}</p>}
 </section>;
}
