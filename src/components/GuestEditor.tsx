"use client";
import {useState,type FormEvent} from "react";
import {banquetMenu} from "@/content/menu.mjs";
import {drinkChoices,toggleDrink} from "@/content/drinks.mjs";
import {congratulations} from "@/content/congratulations.mjs";
import {partyInterest} from "@/content/party-interest.mjs";
import {returnTransferCopy} from "@/content/return-transfer.mjs";

export type RsvpEdit = {
 guestName:string;attendance:"yes"|"no";who:string;partyInterest:string;
 congratulationChoice:string;congratulationCompanion:string;
 hotAppetizer:string;mainCourse:string;food:string;musicRequest:string;
 transfer:string;returnTransfer:string;alcoholDrinks:string[];alcoholOther:string;
 softDrinks:string[];softOther:string;dressCodeConfirmed:boolean;venueRulesAccepted:boolean;
};
type EditableKey=Exclude<keyof RsvpEdit,"venueRulesAccepted">;
const fields:EditableKey[]=[
 "guestName","attendance","who","partyInterest","congratulationChoice","congratulationCompanion",
 "hotAppetizer","mainCourse","food","musicRequest","transfer","returnTransfer",
 "alcoholDrinks","alcoholOther","softDrinks","softOther","dressCodeConfirmed"
];
type Props={
 guest:{id:string;name:string;updatedAt:string;edit?:RsvpEdit};
 busy:boolean;
 cancel:()=>void;
 save:(changes:Partial<RsvpEdit>,confirmAttendance:boolean)=>Promise<string|null>;
};
const transferOptions=[{value:"self",label:"Доедет самостоятельно"},{value:"kupchino",label:"Нужен из Купчино"},{value:"pavlovsk",label:"Нужен из Павловска"}];
function Choice({title,value,options,onChange,required=false}:{title:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void;required?:boolean}){
 return <label className="organizer-edit-field">{title}{required&&<span aria-hidden="true"> *</span>}
  <select value={value} required={required} onChange={event=>onChange(event.target.value)}>
   <option value="">Не указано</option>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
  </select>
 </label>;
}
function TextField({title,value,onChange,maxLength,rows}:{title:string;value:string;onChange:(value:string)=>void;maxLength:number;rows?:number}){
 return <label className="organizer-edit-field">{title}{rows?
  <textarea rows={rows} maxLength={maxLength} value={value} onChange={event=>onChange(event.target.value)}/>:
  <input type="text" maxLength={maxLength} value={value} onChange={event=>onChange(event.target.value)}/>}
 </label>;
}
function Drinks({kind,values,other,onChange,onOther}:{kind:"alcohol"|"soft";values:string[];other:string;onChange:(v:string[])=>void;onOther:(v:string)=>void}){
 const choices=[...drinkChoices[kind].options,...(kind==='alcohol'&&values.includes('wine')?[{id:'wine',label:'Вино (без уточнения цвета)'}]:[])];
 return <fieldset className="organizer-edit-drinks"><legend>{kind==='alcohol'?'Алкоголь':'Безалкогольное'}</legend>
 <div className="organizer-edit-drink-grid">{choices.map(option=><label key={option.id} className="organizer-edit-check"><input type="checkbox" checked={values.includes(option.id)} onChange={()=>{const next=toggleDrink(values,option.id);onChange(next);if(!next.includes('other'))onOther('');}}/><span>{option.label}</span></label>)}</div>
 {values.includes('other')&&<TextField title="Свой вариант" value={other} onChange={onOther} maxLength={80}/>}
 </fieldset>;
}
export function GuestEditor({guest,busy,cancel,save}:Props){
 const initial=guest.edit!;
 const [form,setForm]=useState<RsvpEdit>(()=>({...initial,alcoholDrinks:[...initial.alcoholDrinks],softDrinks:[...initial.softDrinks]}));
 const [confirmed,setConfirmed]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState('');
 const set=<K extends keyof RsvpEdit,>(key:K,value:RsvpEdit[K])=>{setForm(old=>({...old,[key]:value}));setError('');};
 const changeStatus=form.attendance!==initial.attendance;
 const fieldsToSave=fields.filter(key=>JSON.stringify(form[key])!==JSON.stringify(initial[key])&&(
   form.attendance==='yes'||key==='guestName'||key==='attendance'));
 const changed=fieldsToSave.length>0;
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||saving)return;
  if(!changed){setError('Ты ничего не изменил(а).');return;}
  if(changeStatus&&!confirmed){setError('Подтверди изменение статуса участия.');return;}
  if(form.attendance==='yes'&&initial.attendance==='no'&&!form.dressCodeConfirmed){setError('Подтверди, что гость знает о дресс-коде.');return;}
  const payload:Partial<RsvpEdit>={};
  for(const key of fieldsToSave)(payload as Record<string,unknown>)[key]=form[key];
  setSaving(true);setError('');
  try{const message=await save(payload,changeStatus&&confirmed);if(message)setError(message);}
  catch{setError('Не удалось сохранить. Попробуй ещё раз.');}
  finally{setSaving(false);}
 }
 const locked=busy||saving;
 return <article className="organizer-detail organizer-editor">
  <button type="button" className="organizer-back" disabled={locked} onClick={cancel}>← К ответу гостя</button>
  <h2>Редактировать ответ</h2>
  <p className="organizer-muted">Изменения сохраняются в существующей заявке гостя. Они сразу учитываются в списках и статистике.</p>
  <form onSubmit={submit} className="organizer-edit-form">
    <TextField title="Имя и фамилия" value={form.guestName} maxLength={80} onChange={v=>set('guestName',v)}/>
    <Choice title="Присутствие" value={form.attendance} options={[{value:'yes',label:'Приду'},{value:'no',label:'Не приду'}]} onChange={v=>set('attendance',v as RsvpEdit['attendance'])}/>
    {form.attendance==='yes'&&<>
      <TextField title="Кто вы?" value={form.who} maxLength={120} onChange={v=>set('who',v)}/>
      <Choice title={partyInterest.title} value={form.partyInterest} options={partyInterest.choices} onChange={v=>set('partyInterest',v)}/>
      <Choice title="Поздравление" value={form.congratulationChoice} options={congratulations.options.map(o=>({value:o.id,label:o.label}))} onChange={v=>set('congratulationChoice',v)}/>
      {form.congratulationChoice==='public_with_someone'&&<TextField title="С кем будет поздравление?" maxLength={120} value={form.congratulationCompanion} onChange={v=>set('congratulationCompanion',v)}/>}
      <Choice title="Горячая закуска" value={form.hotAppetizer} options={banquetMenu.hotAppetizer.options.map(o=>({value:o.id,label:o.label}))} onChange={v=>set('hotAppetizer',v)}/>
      <Choice title="Основное блюдо" value={form.mainCourse} options={banquetMenu.mainCourse.options.map(o=>({value:o.id,label:o.label}))} onChange={v=>set('mainCourse',v)}/>
      <TextField title="Аллергии и особенности питания" value={form.food} onChange={v=>set('food',v)} maxLength={300} rows={3}/>
      <Drinks kind="alcohol" values={form.alcoholDrinks} other={form.alcoholOther} onChange={v=>set('alcoholDrinks',v)} onOther={v=>set('alcoholOther',v)}/>
      <Drinks kind="soft" values={form.softDrinks} other={form.softOther} onChange={v=>set('softDrinks',v)} onOther={v=>set('softOther',v)}/>
      <Choice title="Трансфер до площадки" value={form.transfer} options={transferOptions} onChange={v=>set('transfer',v)}/>
      <Choice title={returnTransferCopy.title} value={form.returnTransfer} options={returnTransferCopy.options} onChange={v=>set('returnTransfer',v)}/>
      <TextField title="Музыкальные пожелания" value={form.musicRequest} onChange={v=>set('musicRequest',v)} maxLength={300} rows={4}/>
      {initial.attendance==='no'&&<label className="organizer-edit-check organizer-edit-consent"><input type="checkbox" checked={form.dressCodeConfirmed} onChange={e=>set('dressCodeConfirmed',e.target.checked)}/><span>Гость знает о дресс-коде</span></label>}
      <p className="organizer-muted">Согласие с правилами площадки: <strong>{initial.venueRulesAccepted?'получено':'не подтверждено'}</strong>. В админке его нельзя подтверждать за гостя.</p>
    </>}
    {changeStatus&&<div className="organizer-edit-warning">
      <p>{form.attendance==='no'?'При сохранении статуса «Не приду» остальные ответы и подтверждения будут очищены.':'Для статуса «Приду» нужно заполнить обязательные поля. Правила площадки останутся неподтверждёнными, пока гость не даст согласие сам.'}</p>
      <label className="organizer-edit-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>Подтверждаю изменение статуса</span></label>
    </div>}
    {error&&<p className="organizer-edit-error" role="alert">{error}</p>}
    <div className="organizer-edit-actions"><button type="submit" className="organizer-primary" disabled={locked||!changed}>{locked?'Сохраняем…':'Сохранить изменения'}</button><button type="button" disabled={locked} onClick={cancel}>Отмена</button></div>
  </form>
 </article>;
}
