"use client";
import { useState } from "react";
import { questions } from "@/content/questions";
import { Watercolor } from "./Watercolor";

export function Questions() {
  const [expanded, setExpanded] = useState<string[]>([]);
  function toggle(id: string) {
    setExpanded(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  }
  return <section className="questions-chapter chapter" id="questions" aria-labelledby="questions-title">
    <div className="questions-composition">
      <header className="chapter-heading questions-heading">
        <h2 id="questions-title">{questions.title}</h2>
      </header>
      <div className="questions-list">
        {questions.items.map(item => {
          const open = expanded.includes(item.id);
          const triggerId = "question-" + item.id;
          const panelId = "answer-" + item.id;
          return <div className="question-item" key={item.id}>
            <h3 className="question-title">
              <button id={triggerId} type="button" className="question-trigger" aria-expanded={open} aria-controls={panelId} onClick={() => toggle(item.id)}>
                <span>{item.question}</span><span className="question-sign" aria-hidden="true">{open ? "−" : "+"}</span>
              </button>
            </h3>
            <div id={panelId} className="question-panel" data-open={open} role="region" aria-labelledby={triggerId} aria-hidden={!open} inert={!open}>
              <div className="question-panel-clip"><p className="question-answer">
                {item.answer.map((part, index) => "href" in part && part.href
                  ? <a className="question-link" key={index} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>
                  : "placeholder" in part && part.placeholder
                    ? <span className="question-link question-link-pending" key={index} title="Ссылка на вишлист появится позже">{part.text}</span>
                    : <span key={index}>{part.text}</span>)}
              </p></div>
            </div>
          </div>;
        })}
      </div>
    </div>
    <Watercolor kind="spray" className="questions-watercolor" />
  </section>;
}
