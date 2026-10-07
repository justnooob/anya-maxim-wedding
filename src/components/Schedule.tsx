import { publicSections as content } from "@/content/public-sections";
import { Watercolor } from "./Watercolor";

export function Schedule() {
  const program = content.schedule;
  return <section className="schedule-chapter chapter" id="schedule" aria-labelledby="schedule-title">
    <header className="chapter-heading"><h2 id="schedule-title">{program.title}</h2><p>{program.intro}</p></header>
    <ol className="schedule-spread">{program.items.map(item => <li key={item.time}><span className="schedule-time">{item.time}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></li>)}</ol>
    <p className="schedule-note">{program.note}</p>
    <Watercolor kind="atelier-09" className="schedule-watercolor" />
  </section>;
}
