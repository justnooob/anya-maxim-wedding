"use client";
import { useRef, useState, type FormEvent } from "react";
import { publicSections as content } from "@/content/public-sections";
import { invitation } from "@/content/invitation";
import { Watercolor } from "./Watercolor";

export function RSVP() {
  const copy = content.rsvp;
  const [attendance, setAttendance] = useState<"yes" | "no" | null>(null);
  const [name, setName] = useState("");
  const [transfer, setTransfer] = useState("");
  const [overnight, setOvernight] = useState("");
  const [dress, setDress] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const successRef = useRef<HTMLDivElement>(null);
  const valid = name.trim().length > 0 && attendance !== null && (attendance === "no" || (transfer !== "" && overnight !== "" && dress));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || sent) { setError(copy.validation); return; }
    setSent(true);
    requestAnimationFrame(() => successRef.current?.focus());
  }
  return <section className="rsvp-chapter chapter" id="rsvp" aria-labelledby="rsvp-title">
    <header className="chapter-heading"><h2 id="rsvp-title">{copy.title}</h2><p>{copy.intro}</p></header>
    <div className="rsvp-paper">
      <Watercolor kind="atelier-10" className="rsvp-watercolor" />
      {sent ? <div className="rsvp-confirmation" tabIndex={-1} ref={successRef} role="status">
        <span className="confirmation-mark" aria-hidden="true">♡</span><h3>{name.trim()},</h3><p>{attendance === "yes" ? copy.successYes : copy.successNo}</p>
        {attendance === "yes" && <p className="confirmation-date">{invitation.date}<br />{copy.starts} {invitation.time}</p>}
        <p className="quiet-note">{copy.demo}</p><button className="paper-link" type="button" onClick={() => { setSent(false); setError(""); }}>{copy.reset}</button>
      </div> : <form onSubmit={submit}>
        <label className="writing-field"><span>{copy.name}</span><input name="guestName" autoComplete="name" value={name} onChange={event => setName(event.target.value)} maxLength={120} required /></label>
        <fieldset className="attendance-choice"><legend>{copy.attendance}</legend><div className="attendance-buttons"><button type="button" aria-pressed={attendance === "yes"} onClick={() => setAttendance("yes")}>{copy.yes}</button><button type="button" aria-pressed={attendance === "no"} onClick={() => setAttendance("no")}>{copy.no}</button></div></fieldset>
        {attendance !== "no" && <fieldset className="rsvp-details page-enter" disabled={attendance !== "yes"}><legend className="sr-only">{copy.details}</legend>
          <label className="writing-field"><span>{copy.who}</span><input name="who" placeholder={copy.whoPlaceholder} maxLength={240} /></label>
          <label className="writing-field"><span>{copy.food}</span><textarea name="food" placeholder={copy.foodPlaceholder} maxLength={600} rows={2} /></label>
          <fieldset className="paper-options"><legend>{copy.transfer}</legend>{copy.transferOptions.map((option, index) => <label key={option}><input type="radio" name="transfer" value={index} checked={transfer === String(index)} onChange={() => setTransfer(String(index))} required={attendance === "yes"} /><span>{option}</span></label>)}</fieldset>
          <fieldset className="paper-options"><legend>{copy.overnight}</legend>{copy.overnightOptions.map((option, index) => <label key={option}><input type="radio" name="overnight" value={index} checked={overnight === String(index)} onChange={() => setOvernight(String(index))} required={attendance === "yes"} /><span>{option}</span></label>)}</fieldset>
          <label className="paper-checkbox"><input type="checkbox" checked={dress} onChange={event => setDress(event.target.checked)} required={attendance === "yes"} /><span>{copy.dressPrefix}{" "}<a href="#dress-code">{copy.dressLink}</a></span></label>
        </fieldset>}
        {attendance === null && <p className="quiet-note">{copy.pending}</p>}
        {attendance === "no" && <p className="rsvp-no-note page-enter">{copy.noNote}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="foil-button" type="submit" disabled={!valid}>{copy.submit}<span aria-hidden="true">→</span></button>
        <p className="quiet-note rsvp-demo">{copy.demo}</p>
      </form>}
    </div>
  </section>;
}
