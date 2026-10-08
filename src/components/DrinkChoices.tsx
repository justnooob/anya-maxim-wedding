"use client";
import {RequiredMark} from "./RequiredMark";
import {drinkChoices, toggleDrink} from "@/content/drinks.mjs";
import {withinLimit} from '@/content/rsvp-limits.mjs';
export function DrinkChoices({kind,selected,other,onSelect,onOther}:{kind:"alcohol"|"soft";selected:string[];other:string;onSelect:(value:string[])=>void;onOther:(value:string)=>void}) {
  const copy=drinkChoices[kind];
  return <fieldset className="paper-options drink-options">
    <legend>{copy.title}<RequiredMark /></legend>
    <p className="quiet-note drink-hint">{drinkChoices.hint}</p>
    <div className="drink-options-grid">{copy.options.map(option=><label className={"paper-checkbox"+(option.id==="other"?" drink-option-other":"")} key={option.id}>
      <input type="checkbox" name={kind+"Drinks"} value={option.id} checked={selected.includes(option.id)} onChange={()=>{
        const next=toggleDrink(selected,option.id);onSelect(next);if(!next.includes("other"))onOther("");
      }}/><span>{option.label}</span>
    </label>)}</div>
    {selected.includes("other")&&<label className="writing-field drink-other"><span>{copy.otherLabel}<RequiredMark /></span>
      <input name={kind+"Other"} value={other} onChange={event=>onOther(event.target.value)} aria-invalid={!withinLimit(kind+"Other",other)} required aria-describedby={kind+"-other-limit"} placeholder="Напиши название напитка"/><small id={kind+"-other-limit"} className="quiet-note">Не больше 80 символов</small>
    </label>}
  </fieldset>;
}
