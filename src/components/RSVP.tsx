"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { publicSections as content } from "@/content/public-sections";
import { invitation } from "@/content/invitation";
import { RequiredMark } from "./RequiredMark";
import { DrinkChoices } from "./DrinkChoices";
import { Watercolor } from "./Watercolor";

import {rsvpReady,attendancePayload,withinLimit,validGuestName} from '@/content/rsvp-limits.mjs';
import {rsvpFieldIssues} from '@/content/rsvp-field-issues.mjs';
import {boundedJson,requestMessage} from '@/client/requests.mjs';
import {banquetMenu,menuHint} from '@/content/menu.mjs';
import {congratulations,congratulationReady,congratulationFields,companionLimit} from '@/content/congratulations.mjs';
import {DRAFT_KEY,LEGACY_DRAFT_KEY,parseDraft} from '@/client/rsvp-draft.mjs';
import {TextCounter} from './TextCounter';
import {returnTransferCopy,validReturnTransfer} from '@/content/return-transfer.mjs';
import {MAX_SESSION_GUESTS,guestSessionCopy} from '@/content/guest-session.mjs';
type TransferChoice="self"|"kupchino"|"pavlovsk";
type SavedGuest={id?:string;guestName:string;attendance:"yes"|"no"};
export function RSVP() {
  const copy = content.rsvp;
  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  const [name, setName] = useState("");
  const [who, setWho] = useState("");
  const [transfer, setTransfer] = useState<TransferChoice|"">("");
  const [returnTransfer,setReturnTransfer]=useState('');
  const [returnTransferTouched,setReturnTransferTouched]=useState(false);
  const [alcoholDrinks, setAlcoholDrinks] = useState<string[]>([]);
  const [alcoholOther, setAlcoholOther] = useState("");
  const [softDrinks, setSoftDrinks] = useState<string[]>([]);
  const [softOther, setSoftOther] = useState("");
  const [dress, setDress] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [csrf, setCsrf] = useState("");
  const [error, setError] = useState("");
  const [food,setFood]=useState('');
  const [musicRequest,setMusicRequest]=useState('');
  const [saved,setSaved]=useState<SavedGuest[]>([]);
  const [hotAppetizer,setHotAppetizer]=useState('');
  const [mainCourse,setMainCourse]=useState('');
  const [venueRules,setVenueRules]=useState(false);
  const [draftLoaded,setDraftLoaded]=useState(false);
  const [congratulationChoice,setCongratulationChoice]=useState('');
  const [congratulationCompanion,setCongratulationCompanion]=useState('');
  const [companionTouched,setCompanionTouched]=useState(false);
  const [pdfBusy,setPdfBusy]=useState(false);
  const [pdfError,setPdfError]=useState('');
  const [showIssues,setShowIssues]=useState(false);
  const draftRestored=useRef(false);
  const adding=useRef(false);
  const submissionKey=useRef<string>("");
  const lastSavedCount=useRef(0);
  const requestVersion=useRef(0);
  const clearFields=useCallback(()=>{setHotAppetizer('');setMainCourse('');setName('');setAttendance(null);setWho('');setFood('');setMusicRequest('');setTransfer('');setReturnTransfer('');setReturnTransferTouched(false);setAlcoholDrinks([]);setAlcoholOther('');setSoftDrinks([]);setSoftOther('');setDress(false);setVenueRules(false);setCongratulationChoice('');setCongratulationCompanion('');setCompanionTouched(false);setError('');setShowIssues(false);},[]);
  useEffect(()=>{
    if(draftRestored.current)return;draftRestored.current=true;
    try{const draft=parseDraft(sessionStorage.getItem(DRAFT_KEY)||sessionStorage.getItem(LEGACY_DRAFT_KEY));if(draft){
      if(draft.name.trim())adding.current=true;
      setCongratulationChoice(draft.congratulationChoice);setCongratulationCompanion(draft.congratulationCompanion);
      setName(draft.name);setAttendance(draft.attendance);setWho(draft.who);setFood(draft.food);setMusicRequest(draft.musicRequest);
      setTransfer(draft.transfer);setReturnTransfer(draft.returnTransfer);setAlcoholDrinks(draft.alcoholDrinks);setAlcoholOther(draft.alcoholOther);setSoftDrinks(draft.softDrinks);setSoftOther(draft.softOther);
      setHotAppetizer(draft.hotAppetizer);setMainCourse(draft.mainCourse);setDress(draft.dress);setVenueRules(draft.venueRules);
    }else sessionStorage.removeItem(DRAFT_KEY);}catch{}
    try{sessionStorage.removeItem(LEGACY_DRAFT_KEY);}catch{}
    setDraftLoaded(true);
  },[]);
  useEffect(()=>{
    if(!draftLoaded)return;
    try{if(sent){sessionStorage.removeItem(DRAFT_KEY);return;}
      sessionStorage.setItem(DRAFT_KEY,JSON.stringify({version:2,fields:{congratulationChoice,congratulationCompanion,name,attendance,who,food,musicRequest,transfer,returnTransfer,alcoholDrinks,alcoholOther,softDrinks,softOther,hotAppetizer,mainCourse,dress,venueRules}}));
    }catch{/* Storage may be disabled; the form remains usable. */}
  },[draftLoaded,sent,name,attendance,who,food,musicRequest,transfer,returnTransfer,alcoholDrinks,alcoholOther,softDrinks,softOther,hotAppetizer,mainCourse,dress,venueRules,congratulationChoice,congratulationCompanion]);
  const submitting=useRef(false);
  const successRef = useRef<HTMLDivElement>(null);
  const formRef=useRef<HTMLFormElement>(null);
  useEffect(()=>{if(sent||!adding.current)return;formRef.current?.scrollIntoView({block:"start",behavior:"instant"});formRef.current?.querySelector<HTMLInputElement>("input[name=guestName]")?.focus({preventScroll:true});},[sent]);
  const refreshing = useRef(false);
  const refresh = useCallback(async () => {
    if (refreshing.current||submitting.current) return;
    refreshing.current = true;const version=requestVersion.current;
    try {
      const {response,result} = await boundedJson("/api/rsvp", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error();
      if(version!==requestVersion.current)return;
      setCsrf(result.csrf);
      const answers:SavedGuest[]=result.rsvps||(result.rsvp?[result.rsvp]:[]);setSaved(answers);if(answers.length===0&&lastSavedCount.current>0&&!adding.current){clearFields();submissionKey.current='';}lastSavedCount.current=answers.length;
      if(answers.length>=MAX_SESSION_GUESTS){adding.current=false;clearFields();}
      if(answers.length>0&&!adding.current){setSent(true);}
      else setSent(false);
      if(answers.length===0)adding.current=false;
      setError("");
    } catch { if(version===requestVersion.current)setError(copy.unavailable); }
    finally { refreshing.current = false; }
  }, [copy.unavailable,clearFields]);
  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("pageshow", onFocus); };
  }, [refresh]);
  useEffect(() => {
    if (!sent) return;
    successRef.current?.focus();
    const timer = setInterval(() => { void refresh(); }, 30000);
    return () => clearInterval(timer);
  }, [sent, refresh]);
  const payload=attendancePayload({...congratulationFields(congratulationChoice,congratulationCompanion),guestName:name,attendance,who,hotAppetizer,mainCourse,food,musicRequest,transfer:transfer||null,returnTransfer:returnTransfer||null,dressCode:dress,dressCodeConfirmed:dress,venueRulesAccepted:venueRules,alcoholDrinks,alcoholOther,softDrinks,softOther});
  const valid=rsvpReady({...payload,food,musicRequest});
  const issues=useMemo(()=>rsvpFieldIssues({...payload,food,musicRequest}),[name,attendance,who,hotAppetizer,mainCourse,food,musicRequest,transfer,returnTransfer,dress,venueRules,alcoholDrinks,alcoholOther,softDrinks,softOther,congratulationChoice,congratulationCompanion]);
  useEffect(()=>{
    const form=formRef.current;if(!form||!showIssues)return;
    const markers:Record<string,string>={guestName:'[name=guestName]',attendance:'.attendance-choice',who:'[name=who]',congratulationChoice:'.congratulations-choice',congratulationCompanion:'[name=congratulationCompanion]',hotAppetizer:'[name=hotAppetizer]',mainCourse:'[name=mainCourse]',food:'[name=food]',alcoholDrinks:'.drink-options',alcoholOther:'[name=alcoholOther]',softDrinks:'.drink-options + .drink-options',softOther:'[name=softOther]',transfer:'[name=transfer]',returnTransfer:'.return-transfer-options',musicRequest:'[name=musicRequest]',dress:'[name=dressCode]',venueRules:'[name=venueRules]'};
    form.querySelectorAll<HTMLElement>('[data-field-error]').forEach(el=>{el.removeAttribute('data-field-error');el.removeAttribute('aria-invalid');});
    form.querySelectorAll<HTMLElement>('.field-error-message').forEach(el=>el.remove());
    for(const [key,message] of Object.entries(issues)){
      const target=form.querySelector<HTMLElement>(markers[key]);if(!target)continue;
      const group=target.closest<HTMLElement>('.writing-field,.paper-options,.paper-checkbox,.attendance-choice')||target;
      group.dataset.fieldError='true';
      if(target.matches('input,textarea'))target.setAttribute('aria-invalid','true');
      const note=document.createElement('small');note.className='field-error-message';note.textContent=message;note.setAttribute('role','status');group.append(note);
    }
  },[showIssues,issues];
  function revealIssues(){
    setShowIssues(true);setError('Проверь выделенные поля выше.');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const first=formRef.current?.querySelector<HTMLElement>('[data-field-error="true"]');
      first?.scrollIntoView({behavior:'smooth',block:'center'});
      first?.querySelector<HTMLElement>('input,textarea,button')?.focus({preventScroll:true});
    }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(submitting.current)return;
    if (!valid) { revealIssues(); return; }
    if(sent||busy||!csrf){setError(copy.unavailable);return;}
    submitting.current=true;requestVersion.current++;
    setBusy(true); setError("");setShowIssues(false);
    try {
      const {response,result} = await boundedJson("/api/rsvp", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({...payload,submissionKey:submissionKey.current||(submissionKey.current=crypto.randomUUID())}),
      });
      if (!response.ok) {setError(requestMessage(response.status));if(response.status===409){adding.current=false;submitting.current=false;await refresh();}return;}
      setSaved(result.rsvps||[result.rsvp]);lastSavedCount.current=(result.rsvps||[result.rsvp]).length;adding.current=false;setSent(true);try{sessionStorage.removeItem(DRAFT_KEY);}catch{}
    } catch { setError(copy.unavailable); }
    finally { submitting.current=false;setBusy(false); }
  }
  function addGuest(){
    if(submitting.current||saved.length>=MAX_SESSION_GUESTS)return;
    adding.current=true;requestVersion.current++;submissionKey.current='';clearFields();setSent(false);
  }
  async function downloadTicket(){
    if(pdfBusy)return;setPdfBusy(true);setPdfError('');
    try{const response=await fetch('/api/rsvp/invitation',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(30000)});
      if(!response.ok||!response.headers.get('content-type')?.includes('application/pdf'))throw new Error();
      const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='anya-maxim-invitation.pdf';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch{setPdfError('Не удалось скачать приглашение. Ответы сохранены, попробуйте ещё раз.');}finally{setPdfBusy(false);}
  }
  function cancelAdding(){if(submitting.current||!saved.length)return;adding.current=false;requestVersion.current++;submissionKey.current='';clearFields();try{sessionStorage.removeItem(DRAFT_KEY);}catch{}setSent(true);}
  return <section className="rsvp-chapter chapter" id="rsvp" aria-labelledby={sent ? "rsvp-success-title" : "rsvp-title"}>
    {!sent && <header className="chapter-heading"><h2 id="rsvp-title">{copy.title}</h2><p>{copy.intro}</p></header>}
    <div className="rsvp-paper">
      <Watercolor kind="atelier-10" className="rsvp-watercolor" />
      {sent ? <div className="rsvp-confirmation" tabIndex={-1} ref={successRef} role="status">
        <span className="confirmation-mark" aria-hidden="true">♡</span><h3 id="rsvp-success-title">{guestSessionCopy.success}</h3>
        <p className="saved-guests-heading">{guestSessionCopy.answers}</p>
        {saved.map((guest,index)=><div className="saved-guest" key={guest.id||index}><h4>{guest.guestName.trim()}</h4><p>{guest.attendance==='yes'?'Приду':'Не приду'}</p></div>)}
        <p>{copy.successYes}</p>
        {(saved.some(guest=>guest.attendance==='yes')||(!saved.length&&attendance==='yes'))&&<p className="confirmation-date">{invitation.date}<br />{copy.starts} {invitation.time}</p>}
        <button className="foil-button ticket-download" type="button" disabled={pdfBusy} onClick={()=>void downloadTicket()}>{pdfBusy?"Готовим приглашение…":guestSessionCopy.download}<span aria-hidden="true">↓</span></button>{pdfError&&<p className="form-error" role="alert">{pdfError}</p>}
        {saved.length<MAX_SESSION_GUESTS?<><p className="quiet-note">{copy.additionalGuestHint}</p><button className="paper-link" type="button" onClick={addGuest}>{copy.addGuest}</button></>:<p className="quiet-note">{guestSessionCopy.limit}</p>}

      </div> : <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
        {saved.length>0&&<button className="paper-link cancel-guest" type="button" disabled={busy} onClick={cancelAdding}>{guestSessionCopy.cancel}</button>}
        <p className="quiet-note required-hint">{copy.requiredHint}</p>
        <label className="writing-field"><span>{copy.name}<RequiredMark /></span><input name="guestName" maxLength={80} placeholder="Как к тебе обращаться" disabled={busy} autoComplete="name" value={name} onChange={event => setName(event.target.value)} aria-invalid={name.length>0&&!validGuestName(name)} aria-describedby="name-limit" required /><small id="name-limit" className="quiet-note">Не больше 80 символов</small></label>
        <fieldset className="attendance-choice"><legend>{copy.attendance}<RequiredMark /></legend><div className="attendance-buttons"><button type="button" disabled={busy} aria-pressed={attendance === "yes"} onClick={() => setAttendance("yes")}>{copy.yes}</button><button type="button" disabled={busy} aria-pressed={attendance === "no"} onClick={() => setAttendance("no")}>{copy.no}</button></div></fieldset>
        {attendance !== "no" && <fieldset className="rsvp-details page-enter" disabled={attendance !== "yes" || busy}><legend className="sr-only">{copy.details}</legend>
          <label className="writing-field"><span>{copy.who}<RequiredMark /></span><input name="who" placeholder={copy.whoPlaceholder} aria-invalid={!withinLimit("who",who)} value={who} onChange={event=>setWho(event.target.value)} required={attendance === "yes"} aria-describedby="who-limit" /><small id="who-limit" className="quiet-note">Не больше 120 символов</small></label>
          <fieldset className="paper-options congratulations-choice"><legend>{congratulations.title}<RequiredMark/></legend>{congratulations.options.map(option=><label key={option.id}><input type="radio" name="congratulationChoice" value={option.id} checked={congratulationChoice===option.id} onChange={()=>{setCongratulationChoice(option.id);setCompanionTouched(false);}} required={attendance==='yes'}/><span>{option.label}</span></label>)}</fieldset>
          {congratulationChoice==='public_with_someone'&&<label className="writing-field companion-field page-enter"><span>{congratulations.companionLabel}<RequiredMark/></span><input name="congratulationCompanion" placeholder={congratulations.companionPlaceholder} value={congratulationCompanion} onChange={event=>setCongratulationCompanion(event.target.value)} onBlur={()=>setCompanionTouched(true)} required={attendance==='yes'} aria-invalid={companionTouched&&!congratulationReady(congratulationChoice,congratulationCompanion)} aria-describedby="companion-error companion-limit"/><small id="companion-limit" className="quiet-note">Не больше {companionLimit} символов</small>{companionTouched&&!congratulationReady(congratulationChoice,congratulationCompanion)&&<small id="companion-error" className="form-error" role="status">{congratulationCompanion.trim()?`Не больше ${companionLimit} символов.`:congratulations.companionError}</small>}</label>}
          <div className="rsvp-food-block">
          {(['hotAppetizer','mainCourse'] as const).map(kind=><fieldset className="paper-options menu-choice" key={kind}><legend>{banquetMenu[kind].title}<RequiredMark /></legend><p className="quiet-note">{menuHint}</p><div>{banquetMenu[kind].options.map(option=><label key={option.id}><input type="radio" name={kind} value={option.id} checked={(kind==='hotAppetizer'?hotAppetizer:mainCourse)===option.id} onChange={()=>{(kind==='hotAppetizer'?setHotAppetizer:setMainCourse)(option.id);}} required={attendance==='yes'}/><span>{option.label}</span></label>)}</div></fieldset>)}
          <label className="writing-field"><span>{copy.food}</span><textarea name="food" placeholder={copy.foodPlaceholder} value={food} onChange={event=>setFood(event.target.value)} aria-invalid={!withinLimit("food",food)} aria-describedby="food-counter" rows={2} /><TextCounter field="food" value={food} /></label>
          </div>
          <DrinkChoices kind="alcohol" selected={alcoholDrinks} other={alcoholOther} onSelect={setAlcoholDrinks} onOther={setAlcoholOther} />
          <DrinkChoices kind="soft" selected={softDrinks} other={softOther} onSelect={setSoftDrinks} onOther={setSoftOther} />
          <fieldset className="paper-options"><legend>{copy.transfer}<RequiredMark /></legend>{copy.transferOptions.map(option => <label key={option.value}><input type="radio" name="transfer" value={option.value} checked={transfer === option.value} onChange={() => setTransfer(option.value)} required={attendance === "yes"} /><span>{option.label}</span></label>)}</fieldset>
          <fieldset className="paper-options return-transfer-options" aria-describedby={returnTransfer?undefined:"return-transfer-hint"} aria-invalid={returnTransferTouched&&!validReturnTransfer(returnTransfer)} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setReturnTransferTouched(true);}}>
           <legend>{returnTransferCopy.title}<RequiredMark/></legend>{returnTransferCopy.options.map(option=><label key={option.value}><input type="radio" name="returnTransfer" value={option.value} checked={returnTransfer===option.value} onChange={()=>setReturnTransfer(option.value)} required={attendance==='yes'}/><span>{option.label}</span></label>)}
           {!returnTransfer&&<p id="return-transfer-hint" className={returnTransferTouched?'form-error':'quiet-note'} role={returnTransferTouched?'status':undefined}>{returnTransferTouched?returnTransferCopy.error:returnTransferCopy.hint}</p>}
          </fieldset>
          <label className="writing-field music-field"><span>{copy.musicTitle}</span><small id="music-hint" className="quiet-note">{copy.musicHint}</small><textarea name="musicRequest" value={musicRequest} onChange={event=>setMusicRequest(event.target.value)} aria-invalid={!withinLimit("musicRequest",musicRequest)} rows={3} aria-describedby="music-hint musicRequest-counter" /><TextCounter field="musicRequest" value={musicRequest} /></label>
          <label className="paper-checkbox"><input name="dressCode" type="checkbox" checked={dress} onChange={event => setDress(event.target.checked)} required={attendance === "yes"} /><span>{copy.dressPrefix}{" "}<a href="#dress-code">{copy.dressLink}</a><RequiredMark /></span></label>
          <label className="paper-checkbox venue-agreement"><input name="venueRules" type="checkbox" checked={venueRules} onChange={event=>setVenueRules(event.target.checked)} required={attendance==="yes"}/><span>{copy.venuePrefix}{" "}<a href="/venue-rules" target="_blank" rel="noopener noreferrer">{copy.venueLink}</a>{copy.venueSuffix}<RequiredMark/></span></label>
        </fieldset>}
        {attendance === null && <p className="quiet-note">{copy.pending}</p>}
        {attendance === "no" && <p className="rsvp-no-note page-enter">{copy.noNote}</p>}
        <button className="foil-button" type="submit" disabled={busy}>{busy ? copy.sending : copy.submit}<span aria-hidden="true">→</span></button>
        <p className="quiet-note rsvp-demo">{copy.privacy}</p>
      </form>}
      {error && !sent && <div role="alert"><p className="form-error">{error}</p><button className="paper-link" type="button" disabled={busy} onClick={() => { void refresh(); }}>{copy.refresh}</button></div>}
    </div>
  </section>;
}
