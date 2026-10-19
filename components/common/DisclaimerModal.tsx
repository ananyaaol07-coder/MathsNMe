"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CalendarClock,
  Check,
  CircleAlert,
  GraduationCap,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const policyPoints = [
  {
    icon: CalendarClock,
    text: "Students must complete at least 60 minutes of practice each week, spread across a minimum of 2–3 sessions.",
  },
  {
    icon: Check,
    text: "Missed daily practice may be completed on another day within the same week.",
  },
  {
    icon: CircleAlert,
    text: "Failure to meet the weekly requirement may result in a payment requirement and temporary restriction of platform access until it is resolved.",
  },
  {
    icon: ShieldCheck,
    text: "Continued lack of participation or progress may result in an account review and removal from the platform.",
  },
  {
    icon: GraduationCap,
    text: "MathsNMe supports Vedic Maths, IB Maths, and problem-solving skills, but does not guarantee improvement in school examination marks.",
  },
  {
    icon: Trophy,
    text: "Olympiad access is available only after at least one year of active learning and depends on the student’s performance and readiness.",
  },
];

const subscribeToClient = () => () => undefined;

export default function DisclaimerModal({
  isOpen,
  onClose,
  onAccept,
}: DisclaimerModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false);
  const isMounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );

  const handleClose = useCallback(() => {
    setHasAccepted(false);
    onClose();
  }, [onClose]);

  const handleAccept = () => {
    setHasAccepted(false);
    onAccept();
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        aria-describedby="disclaimer-description"
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-[#eadfb9] bg-[#fffdf8] shadow-[0_30px_90px_rgba(15,23,42,0.3)]"
      >
        <div className="border-b border-[#eadfb9] bg-gradient-to-r from-[#fff9e8] to-white px-6 py-5 sm:px-8">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-5 top-5 rounded-full border border-[#e8dfc8] bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close learning policy"
          >
            <X size={19} />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4AF37] text-slate-950 shadow-md">
              <ShieldCheck size={25} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7200]">
                Before you begin
              </p>
              <h2 id="disclaimer-title" className="mt-1 text-2xl font-black text-slate-950">
                MathsNMe Learning Policy
              </h2>
              <p id="disclaimer-description" className="mt-1 text-sm text-slate-600">
                Please review these important points before creating an account.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 sm:px-8">
          <ul className="space-y-3">
            {policyPoints.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex gap-3 rounded-2xl border border-[#eee5ce] bg-white p-4 text-sm leading-6 text-slate-700"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fff4cc] text-[#a67800]">
                  <Icon size={17} />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#fff4cc]/70 p-4 text-sm font-semibold leading-6 text-slate-700">
            <input
              type="checkbox"
              checked={hasAccepted}
              onChange={(event) => setHasAccepted(event.target.checked)}
              className="peer sr-only"
            />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#c8ad59] bg-white text-white peer-checked:border-[#B8860B] peer-checked:bg-[#B8860B]">
              <Check size={14} strokeWidth={3} />
            </span>
            <span>
              I have read and agree to the MathsNMe Learning Policy on behalf of myself and, where applicable, the student.
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eadfb9] bg-white px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-[#ddd3ba] px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasAccepted}
            onClick={handleAccept}
            className="group flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-slate-950 shadow-md transition hover:bg-[#c79d18] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            Agree &amp; continue
            <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
