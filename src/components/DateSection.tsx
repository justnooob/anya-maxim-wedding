import { event } from "@/content/calendar";
import { GoldFoil } from "./GoldFoil";
import { Watercolor } from "./Watercolor";
import { invitation as content } from "@/content/invitation";

export function DateSection() {
  const weddingDate = new Date(content.dateISO + "T12:00:00Z");
  const year = weddingDate.getUTCFullYear();
  const month = weddingDate.getUTCMonth();
  const day = weddingDate.getUTCDate();
  const offset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const rows = Array.from({ length: Math.ceil((offset + days) / 7) }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const value = week * 7 + weekday - offset + 1;
      return value > 0 && value <= days ? value : null;
    })
  );
  const monthLabel = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" }).format(weddingDate).replace(" г.", "");
  return (
    <section className="wedding-date-section" id="date" aria-label="Дата свадьбы">
      <div className="date-intro">
        <p className="date-invitation">{content.story}</p>
        <time className="date-large" dateTime={content.dateISO}>{content.date}</time>
        <p className="date-start">Начало в <strong>{content.time}</strong></p>
      </div>
      <div className="wedding-calendar">
        <Watercolor kind="atelier-01" className="calendar-leaves calendar-leaves--left" />
        <Watercolor kind="atelier-02" className="calendar-leaves calendar-leaves--right" />
        <div className="calendar-ornament" aria-hidden="true"><span />♡<span /></div>
        <table>
          <caption>{monthLabel}</caption>
          <thead><tr>{content.calendar.weekdays.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{rows.map((week, index) => <tr key={index}>{week.map((value, column) => <td key={column}>{value === day ? <GoldFoil className="calendar-wedding-day" label={content.calendar.selectedLabel}>{value}</GoldFoil> : value !== null ? <span>{value}</span> : null}</td>)}</tr>)}</tbody>
        </table>
        <a className="calendar-reminder foil-button" href="/calendar.ics"><span>{event.reminderLabel}</span><span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
