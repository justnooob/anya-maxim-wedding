"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A short foil glint at irregular intervals, only while visible and motion is allowed. */
export function GoldFoil({ children, className, label, enabled = true }: {
  children: ReactNode;
  className: string;
  label?: string;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    function stop() {
      clearTimeout(timer);
      element!.removeAttribute("data-shimmer");
    }
    function schedule() {
      stop();
      if (!visible || document.hidden || motion.matches) return;
      timer = setTimeout(() => {
        element!.setAttribute("data-shimmer", "true");
        timer = setTimeout(schedule, 1500);
      }, 3000 + Math.random() * 4000);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }, { threshold: .4 });
    observer.observe(element);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, [enabled]);
  return <span ref={ref} className={className} aria-label={label}>{children}</span>;
}
