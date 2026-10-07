"use client";

import { useEffect, useRef, useState } from "react";
import { GoldFoil } from "./GoldFoil";
import { Watercolor } from "./Watercolor";
import { invitation as content } from "@/content/invitation";

type Stage = "sealed" | "extracting" | "letter" | "folding" | "flight";
const timing = { extraction: 2900, folding: 1800, flight: 1150 };

export function OpeningScene({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>("sealed");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const locked = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function later(action: () => void, delay: number) {
    timers.current.push(setTimeout(action, delay));
  }

  function openEnvelope() {
    if (locked.current) return;
    locked.current = true;
    setStage("extracting");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    later(() => {
      setStage("letter");
      locked.current = false;
    }, reduced ? 100 : timing.extraction);
  }

  function foldLetter() {
    if (locked.current) return;
    locked.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStage("folding");
    later(() => setStage("flight"), reduced ? 100 : timing.folding);
    later(onComplete, reduced ? 200 : timing.folding + timing.flight);
  }

  const unfolded = stage === "extracting" || stage === "letter";
  const folded = stage === "folding" || stage === "flight";

  return (
    <section className={"opening opening--" + stage} aria-label="Открыть приглашение">
      <Watercolor kind="slender" className="art-opening-left" />
      <Watercolor kind="spray" className="art-opening-right" />
      <div className="opening-top"><span className="opening-signature">Anya & Maxim</span><span>{content.date}</span></div>
      <div className="opening-title">
        <h1><span className="opening-message-desktop">{content.opening.desktopMessage}</span><span className="opening-message-mobile">{content.opening.message}</span></h1>
      </div>

      <div className="envelope-stage" data-unfolded={unfolded} data-folded={folded}>
        {/* The front and back follow the same path; the letter moves independently between them. */}
        <div className="envelope-shell envelope-shell--back" aria-hidden="true">
          <div className="envelope-back" />
          <div className="envelope-flap" />
        </div>

        <div className="letter-rig">
          <div className="letter-paper">
            <div className="paper-body" aria-hidden="true" />
            <div className="letter-decoration" aria-hidden="true"><span>✦</span></div>

            <div className="letter-content" aria-hidden={stage !== "letter"}>
              <span className="letter-number">{content.opening.attention}</span>
              <p>{content.opening.letter}</p>
              <GoldFoil className="letter-names" enabled={stage === "letter"}>{content.names.bride} <span>&</span> {content.names.groom}</GoldFoil>
              <span className="letter-date">{content.date} · {content.time}</span>
              <button className="ink-button botanical-button" onClick={foldLetter} disabled={stage !== "letter"} tabIndex={stage === "letter" ? 0 : -1}>
                <Watercolor kind="corner-left" className="art-button-left" /><Watercolor kind="corner-right" className="art-button-right" /><span>{content.opening.action}</span><span className="button-arrow" aria-hidden="true">→</span>
              </button>
              <div className="letter-callout" aria-hidden="true"><svg viewBox="0 0 60 45"><path d="M53 40C28 42 14 25 20 5M12 14L20 5 29 13" /></svg><span>{content.opening.callout}</span></div>
            </div>
            {/* These are surfaces of the same sheet, visible throughout the folds and flight. */}
            <div className="paper-corner paper-corner--left" aria-hidden="true" />
            <div className="paper-corner paper-corner--right" aria-hidden="true" />
            <div className="paper-wing paper-wing--left" aria-hidden="true" />
            <div className="paper-wing paper-wing--right" aria-hidden="true" />
            <div className="paper-keel" aria-hidden="true" />
            <div className="paper-crease" aria-hidden="true" />
          </div>
        </div>

        <div className="envelope-shell envelope-shell--front">
          <div className="envelope-front" aria-hidden="true" />
          {stage === "sealed" && (
            <button className="seal" onClick={openEnvelope} aria-label="Открыть конверт"><img src="/images/wax-seal.webp" alt="" aria-hidden="true" /></button>
          )}
        </div>
      </div>

      <span className="motion-status" role="status">
        {stage === "extracting" ? "Письмо раскрывается" : stage === "folding" ? "Складываем письмо в самолётик" : ""}
      </span>
      <div className="opening-bottom">
        <span>{stage === "sealed" ? content.opening.sealedHint : content.opening.bottom}</span>

      </div>
      <div className="paper-wipe" aria-hidden="true" />
    </section>
  );
}
