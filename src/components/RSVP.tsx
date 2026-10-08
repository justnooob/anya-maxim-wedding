"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { publicSections as content } from "@/content/public-sections";
import { invitation } from "@/content/invitation";
import { RequiredMark } from "./RequiredMark";
import { DrinkChoices } from "./DrinkChoices";
import { Watercolor } from "./Watercolor";

import {rsvpReady,attendancePayload,withinLimit} from '@/content/rsvp-limits.mjs';
import {boundedJson,requestMessage} from '@/client/requests.mjs';
import {TextCounter} from './TextCounter';
type SavedGuest={id?:string;guestName:string;attendance:"yes"|"no"};
export function RSVP() {
  const copy = content.rsvp;
  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  const [name, setName] = useState("");
  const [who, setWho] = useState("");
  const [transfer, setTransfer] = useState("");
  const [overnight, setOvernight] = useState("");
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
  const adding=useRef(false);
  const submissionKey=useRef<string>("");
  const lastSavedCount=useRef(0);
  const requestVersion=useRef(0);
  const clearFields=useCallback(()=>{setName('');setAttendance(null);setWho('');setFood('');setMusicRequest('');setTransfer('');setOvernight('');setAlcoholDrinks([]);setAlcoholOther('');setSoftDrinks([]);setSoftOther('');setDress(false);setError('');},[]);
  const submitting=useRef(false);
  const successRef = useRef<HTMLDivElement>(null);
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
      if(answers.length>=2||(answers.length>0&&!adding.current)){setSent(true);}
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
  const payload=attendancePayload({guestName:name,attendance,who,food,musicRequest,transfer:transfer===''?null:transfer==='0'?'needed':'self',overnight:overnight===''?null:overnight==='0'?'stay':'leave',dressCode:dress,alcoholDrinks,alcoholOther,softDrinks,softOther});
  const valid=rsvpReady({...payload,food,musicRequest});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(submitting.current)return;
    if (!valid || sent || busy || !csrf) { setError(copy.validation); return; }
    submitting.current=true;requestVersion.current++;
    setBusy(true); setError("");
    try {
      const {response,result} = await boundedJson("/api/rsvp", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({...payload,submissionKey:submissionKey.current||(submissionKey.current=crypto.randomUUID())}),
      });
      if (!response.ok) {if(response.status===409){setSaved(result.rsvps||[]);lastSavedCount.current=(result.rsvps||[]).length;adding.current=false;setSent(true);}else setError(requestMessage(response.status));return;}
      setSaved(result.rsvps||[result.rsvp]);lastSavedCount.current=(result.rsvps||[result.rsvp]).length;adding.current=false;setSent(true);
    } catch { setError(copy.unavailable); }
    finally { submitting.current=false;setBusy(false); }
  }
  function addGuest(){
    if(saved.length>=2||submitting.current)return;
    adding.current=true;requestVersion.current++;submissionKey.current='';clearFields();setSent(false);
  }
  return <section className="rsvp-chapter chapter" id="rsvp" aria-labelledby={sent ? "rsvp-success-title" : "rsvp-title"}>
    {!sent && <header className="chapter-heading"><h2 id="rsvp-title">{copy.title}</h2><p>{copy.intro}</p></header>}
    <div className="rsvp-paper">
      <Watercolor kind="atelier-10" className="rsvp-watercolor" />
      {sent ? <div className="rsvp-confirmation" tabIndex={-1} ref={successRef} role="status">
        <span className="confirmation-mark" aria-hidden="true">♡</span><h3 id="rsvp-success-title">{copy.saved}</h3>
        {(saved.length?saved:[{id:undefined,guestName:name,attendance}]).map((guest,index)=><div className="saved-guest" key={guest.id||index}><h4>{guest.guestName.trim()}</h4><p>{guest.attendance==='yes'?'Придёт':'Не придёт'}</p></div>)}
        <p>{copy.successYes}</p>
        {(saved.some(guest=>guest.attendance==='yes')||(!saved.length&&attendance==='yes'))&&<p className="confirmation-date">{invitation.date}<br />{copy.starts} {invitation.time}</p>}
        {saved.length<2&&<><p className="quiet-note">{copy.secondGuestHint}</p><button className="foil-button" type="button" onClick={addGuest}>{copy.addSecondGuest}<span aria-hidden="true">→</span></button></>}

      </div> : <form onSubmit={submit} aria-busy={busy}>
        <p className="quiet-note required-hint">{copy.requiredHint}</p>
        <label className="writing-field"><span>{copy.name}<RequiredMark /></span><input name="guestName" disabled={busy} autoComplete="name" value={name} onChange={event => setName(event.target.value)} aria-invalid={!withinLimit("guestName",name)} aria-describedby="name-limit" required /><small id="name-limit" className="quiet-note">Не больше 80 символов</small></label>
        <fieldset className="attendance-choice"><legend>{copy.attendance}<RequiredMark /></legend><div className="attendance-buttons"><button type="button" disabled={busy} aria-pressed={attendance === "yes"} onClick={() => setAttendance("yes")}>{copy.yes}</button><button type="button" disabled={busy} aria-pressed={attendance === "no"} onClick={() => setAttendance("no")}>{copy.no}</button></div></fieldset>
        {attendance !== "no" && <fieldset className="rsvp-details page-enter" disabled={attendance !== "yes" || busy}><legend className="sr-only">{copy.details}</legend>
          <label className="writing-field"><span>{copy.who}<RequiredMark /></span><input name="who" placeholder={copy.whoPlaceholder} aria-invalid={!withinLimit("who",who)} value={who} onChange={event=>setWho(event.target.value)} required={attendance === "yes"} aria-describedby="who-limit" /><small id="who-limit" className="quiet-note">Не больше 120 символов</small></label>
          <label className="writing-field"><span>{copy.food}</span><textarea name="food" placeholder={copy.foodPlaceholder} value={food} onChange={event=>setFood(event.target.value)} aria-invalid={!withinLimit("food",food)} aria-describedby="food-counter" rows={2} /><TextCounter field="food" value={food} /></label>
          <DrinkChoices kind="alcohol" selected={alcoholDrinks} other={alcoholOther} onSelect={setAlcoholDrinks} onOther={setAlcoholOther} />
          <DrinkChoices kind="soft" selected={softDrinks} other={softOther} onSelect={setSoftDrinks} onOther={setSoftOther} />
          <fieldset className="paper-options"><legend>{copy.transfer}<RequiredMark /></legend>{copy.transferOptions.map((option, index) => <label key={option}><input type="radio" name="transfer" value={index} checked={transfer === String(index)} onChange={() => setTransfer(String(index))} required={attendance === "yes"} /><span>{option}</span></label>)}</fieldset>
          <label className="writing-field music-field"><span>{copy.musicTitle}</span><small id="music-hint" className="quiet-note">{copy.musicHint}</small><textarea name="musicRequest" value={musicRequest} onChange={event=>setMusicRequest(event.target.value)} aria-invalid={!withinLimit("musicRequest",musicRequest)} rows={3} aria-describedby="music-hint musicRequest-counter" /><TextCounter field="musicRequest" value={musicRequest} /></label>
          <fieldset className="paper-options"><legend>{copy.overnight}<RequiredMark /></legend>{copy.overnightOptions.map((option, index) => <label key={option}><input type="radio" name="overnight" value={index} checked={overnight === String(index)} onChange={() => setOvernight(String(index))} required={attendance === "yes"} /><span>{option}</span></label>)}</fieldset>
          <label className="paper-checkbox"><input type="checkbox" checked={dress} onChange={event => setDress(event.target.checked)} required={attendance === "yes"} /><span>{copy.dressPrefix}{" "}<a href="#dress-code">{copy.dressLink}</a><RequiredMark /></span></label>
        </fieldset>}
        {attendance === null && <p className="quiet-note">{copy.pending}</p>}
        {attendance === "no" && <p className="rsvp-no-note page-enter">{copy.noNote}</p>}
        <button className="foil-button" type="submit" disabled={!valid || busy || !csrf}>{busy ? copy.sending : copy.submit}<span aria-hidden="true">→</span></button>
        <p className="quiet-note rsvp-demo">{copy.privacy}</p>
      </form>}
      {error && !sent && <div role="alert"><p className="form-error">{error}</p><button className="paper-link" type="button" disabled={busy} onClick={() => { void refresh(); }}>{copy.refresh}</button></div>}
    </div>
  </section>;
}
