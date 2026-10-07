import { invitation as content } from "@/content/invitation";

export function Hero() {
  return (
    <section className="portrait-hero" aria-label="Анна и Максим">
      <img className="portrait-hero-photo" src={content.hero.src} alt={content.hero.alt} fetchPriority="high" />
      <div className="portrait-hero-shade" aria-hidden="true" />
      <div className="portrait-hero-copy">
        <h1 className="portrait-names">
          <span>{content.hero.bride}</span>
          <span className="portrait-ampersand"><i aria-hidden="true" />&<i aria-hidden="true" /></span>
          <span>{content.hero.groom}</span>
        </h1>
        <time className="portrait-date" dateTime={content.dateISO}>{content.date}</time>
      </div>
      <a className="portrait-scroll" href="#date" aria-label="Перейти к дате свадьбы">↓</a>
    </section>
  );
}
