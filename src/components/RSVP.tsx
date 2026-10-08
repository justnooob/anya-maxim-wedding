"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { publicSections as content } from "@/content/public-sections";
import { invitation } from "@/content/invitation";
import { RequiredMark } from "./RequiredMark";
import { DrinkChoices } from "./DrinkChoices";
import { Watercolor } from "./Watercolor";

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
  const successRef = useRef<HTMLDivElement>(null);
  const refreshing = useRef(false);
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const response = await fetch("/api/rsvp", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setCsrf(result.csrf);
      if (result.rsvp) { setName(result.rsvp.guestName); setAttendance(result.rsvp.attendance); setSent(true); }
      else setSent(false);
      setError("");
    } catch { setError(copy.unavailable); }
    finally { refreshing.current = false; }
  }, [copy.unavailable]);
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
  const valid = name.trim().length > 0 && attendance !== null && (attendance === "no" || (who.trim().length > 0 && alcoholDrinks.length > 0 && softDrinks.length > 0 && transfer !== "" && overnight !== "" && dress && (!alcoholDrinks.includes("other") || alcoholOther.trim() !== "") && (!softDrinks.includes("other") || softOther.trim() !== "")));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || sent || busy || !csrf) { setError(copy.validation); return; }
    const fields = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ guestName: name, attendance, who: fields.get("who") || "", food: fields.get("food") || "", musicRequest: fields.get("musicRequest") || null,
          transfer: transfer === "0" ? "needed" : "self", overnight: overnight === "0" ? "stay" : "leave", dressCode: dress, alcoholDrinks, alcoholOther, softDrinks, softOther }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || copy.unavailable); return; }
      setName(result.rsvp.guestName); setAttendance(result.rsvp.attendance); setSent(true);
    } catch { setError(copy.unavailable); }
    finally { setBusy(false); }
  }
  return <section className="rsvp-chapter chapter" id="rsvp" aria-labelledby="rsvp-title">
    <header className="chapter-heading"><h2 id="rsvp-title">{copy.title}</h2><p>{copy.intro}</p></header>
    <div className="rsvp-paper">
      <Watercolor kind="atelier-10" className="rsvp-watercolor" />
      {sent ? <div className="rsvp-confirmation" tabIndex={-1} ref={successRef} role="status">
        <span className="confirmation-mark" aria-hidden="true">♡</span><h3>{name.trim()},</h3><p>{attendance === "yes" ? copy.successYes : copy.successNo}</p>
        {attendance === "yes" && <p className="confirmation-date">{invitation.date}<br />{copy.starts} {invitation.time}</p>}
        <p className="quiet-note">{copy.saved}</p>
        <button className="paper-link" type="button" onClick={() => { void refresh(); }}>{copy.refresh}</button>
      </div> : <form onSubmit={submit} aria-busy={busy}>
        <p className="quiet-note required-hint">{copy.requiredHint}</p>
        <label className="writing-field"><span>{copy.name}<RequiredMark /></span><input name="guestName" disabled={busy} autoComplete="name" value={name} onChange={event => setName(event.target.value)} maxLength={120} required /></label>
        <fieldset className="attendance-choice"><legend>{copy.attendance}<RequiredMark /></legend><div className="attendance-buttons"><button type="button" disabled={busy} aria-pressed={attendance === "yes"} onClick={() => setAttendance("yes")}>{copy.yes}</button><button type="button" disabled={busy} aria-pressed={attendance === "no"} onClick={() => setAttendance("no")}>{copy.no}</button></div></fieldset>
        {attendance !== "no" && <fieldset className="rsvp-details page-enter" disabled={attendance !== "yes" || busy}><legend className="sr-only">{copy.details}</legend>
          <label className="writing-field"><span>{copy.who}<RequiredMark /></span><input name="who" placeholder={copy.whoPlaceholder} maxLength={240} value={who} onChange={event=>setWho(event.target.value)} required={attendance === "yes"} /></label>
          <label className="writing-field"><span>{copy.food}</span><textarea name="food" placeholder={copy.foodPlaceholder} maxLength={600} rows={2} /></label>
          <DrinkChoices kind="alcohol" selected={alcoholDrinks} other={alcoholOther} onSelect={setAlcoholDrinks} onOther={setAlcoholOther} />
          <DrinkChoices kind="soft" selected={softDrinks} other={softOther} onSelect={setSoftDrinks} onOther={setSoftOther} />
          <fieldset className="paper-options"><legend>{copy.transfer}<RequiredMark /></legend>{copy.transferOptions.map((option, index) => <label key={option}><input type="radio" name="transfer" value={index} checked={transfer === String(index)} onChange={() => setTransfer(String(index))} required={attendance === "yes"} /><span>{option}</span></label>)}</fieldset>
          <label className="writing-field music-field"><span>{copy.musicTitle}</span><small id="music-hint" className="quiet-note">{copy.musicHint}</small><textarea name="musicRequest" maxLength={1000} rows={3} aria-describedby="music-hint" /></label>
          <fieldset className="paper-options"><legend>{copy.overnight}<RequiredMark /></legend>{copy.overnightOptions.map((option, index) => <label key={option}><input type="radio" name="overnight" value={index} checked={overnight === String(index)} onChange={() => setOvernight(String(index))} required={attendance === "yes"} /><span>{option}</span></label>)}</fieldset>
          <label className="paper-checkbox"><input type="checkbox" checked={dress} onChange={event => setDress(event.target.checked)} required={attendance === "yes"} /><span>{copy.dressPrefix}{" "}<a href="#dress-code">{copy.dressLink}</a><RequiredMark /></span></label>
        </fieldset>}
        {attendance === null && <p className="quiet-note">{copy.pending}</p>}
        {attendance === "no" && <p className="rsvp-no-note page-enter">{copy.noNote}</p>}
        <button className="foil-button" type="submit" disabled={!valid || busy || !csrf}>{busy ? copy.sending : copy.submit}<span aria-hidden="true">→</span></button>
        <p className="quiet-note rsvp-demo">{copy.privacy}</p>
      </form>}
      {error && <div role="alert"><p className="form-error">{error}</p><button className="paper-link" type="button" disabled={busy} onClick={() => { void refresh(); }}>{copy.refresh}</button></div>}
    </div>
  </section>;
}
