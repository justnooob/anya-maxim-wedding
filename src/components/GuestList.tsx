"use client";
import { useState } from "react";
import { Watercolor } from "./Watercolor";
import { mockGuests } from "@/content/guests.mock";
import { publicSections as content } from "@/content/public-sections";

export function GuestList() {
  const [group, setGroup] = useState<"family" | "friends">("family");
  const guests = mockGuests.filter(guest => guest.group === group);
  const copy = content.guests;
  return <section className="guest-chapter chapter" id="guests" aria-labelledby="guests-title">
    <header className="chapter-heading"><h2 id="guests-title">{copy.title}</h2><p>{copy.intro}</p></header>
    <div className="page-switch" aria-label="Наши гости"><button type="button" aria-pressed={group === "family"} aria-controls="guest-album" onClick={() => setGroup("family")}>{copy.family}<small>11</small></button><button type="button" aria-pressed={group === "friends"} aria-controls="guest-album" onClick={() => setGroup("friends")}>{copy.friends}<small>11</small></button></div>
    <div className="guest-album page-enter" id="guest-album" key={group}>{guests.map((guest, index) => <figure className={"guest-print guest-print--" + index % 4} key={guest.id}>
      <div className="guest-photo"><img src={guest.image} alt={"Временный портрет гостя: " + guest.name} loading="lazy" /></div>
      <figcaption><h3>{guest.name}</h3><p>{guest.description}</p></figcaption>
    </figure>)}</div>
    <Watercolor kind="atelier-07" className="guest-watercolor-top" />
    <Watercolor kind="atelier-08" className="guest-watercolor-bottom" />
    <p className="quiet-note guest-note">{copy.note}</p>
  </section>;
}
