"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

const steps = ["5148", "4368", "3588", "2808", "2028", "1248", "468", "312", "156", "156"];

export default function ShortcutDemo() {
  const [answer, setAnswer] = useState("?");
  const [elapsed, setElapsed] = useState("0.00s");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const runDemo = useCallback(() => {
    if (timer.current !== null) return;
    setAnswer("?");
    setElapsed("0.00s");
    setDone(false);
    setRunning(true);
    const start = performance.now();
    timer.current = setInterval(() => {
      const duration = performance.now() - start;
      const count = Math.min(Math.floor(duration / 90), steps.length);
      setElapsed(`${(duration / 1000).toFixed(2)}s`);
      if (count > 0) setAnswer(steps[count - 1]);
      if (count === steps.length) {
        clearInterval(timer.current!);
        timer.current = null;
        setDone(true);
        setRunning(false);
      }
    }, 40);
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let hasPlayed = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        hasPlayed = false;
      } else if (entry.intersectionRatio >= 0.25 && !hasPlayed) {
        hasPlayed = true;
        // Restart even if the previous run is still finishing after a quick scroll.
        if (timer.current !== null) clearInterval(timer.current);
        timer.current = null;
        runDemo();
      }
    }, { threshold: [0, 0.25] });
    observer.observe(card);
    return () => {
      observer.disconnect();
      if (timer.current !== null) clearInterval(timer.current);
      timer.current = null;
    };
  }, [runDemo]);

  return (
    <div ref={cardRef} className="rounded-3xl border border-[#eadfb9] bg-[#FFF8EA] p-6 shadow-sm sm:p-9">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold tracking-widest text-[#B8860B]">LIVE SHORTCUT DEMO</p>
        <span title="Animation elapsed time" className={`min-w-20 rounded-full border bg-white px-4 py-2 text-center text-sm font-semibold tabular-nums ${done ? "border-[#B8860B] text-slate-900" : "border-[#E7C45A] text-slate-600"}`}>{elapsed}</span>
      </div>
      <h3 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">HCF (5148, 780) = <span className="inline-block min-w-[4ch] text-[#B8860B]" aria-hidden="true">{answer}</span><span className="sr-only">{done ? "156" : "Calculating"}</span></h3>
      <div aria-live="polite" aria-atomic="true" className="mt-5 border-t border-dashed border-[#E7C45A] pt-4 text-xl italic leading-relaxed text-[#7a6a3c]">
        {done ? "Repeated subtraction of the difference — no long division, no remainder table." : "Watch what happens when you skip long division."}
        <span className="sr-only">{done ? "The highest common factor is 156." : ""}</span>
      </div>
      <button type="button" onClick={runDemo} disabled={running} className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#E7C45A] px-5 py-2.5 font-semibold text-[#7a6a3c] transition hover:bg-[#FFF4CC] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B8860B] disabled:cursor-wait disabled:opacity-60">
        <RotateCcw size={17} /> Run it again
      </button>
    </div>
  );
}
