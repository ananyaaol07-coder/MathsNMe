"use client";

import { onAuthStateChanged } from "firebase/auth";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { reportsApi } from "@/lib/reports/client";

function readStoredLocation() {
  try {
    const value = JSON.parse(window.localStorage.getItem("mathsnme-wayground-pending-location") || "null");
    return value && typeof value === "object" && typeof value.grade === "number" && typeof value.moduleId === "string" && typeof value.chapterId === "string" && typeof value.exerciseId === "string" && typeof value.activityId === "string" ? value : null;
  } catch { return null; }
}

function hasMissingLocation(value: unknown) {
  const location = value && typeof value === "object" ? value as { grade?: unknown; activityTitle?: unknown } : null;
  return !location || typeof location.grade !== "number" || typeof location.activityTitle !== "string" || /not set/i.test(location.activityTitle);
}

function readPayload() {
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get("result");
  if (!encoded) throw new Error("No Wayground result was received.");
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  // Some Wayground summaries expose the rank (for example, 1/1) before the actual
  // question total. Preserve a completed result when the captured correct count proves
  // that this stale extension payload used the rank as its total.
  if (payload?.source === "wayground-extension" && typeof payload.correct === "number" && typeof payload.incorrect === "number" && typeof payload.total === "number" && payload.total < payload.correct) {
    payload.total = payload.correct + Math.max(0, payload.incorrect);
  }
  const storedLocation = readStoredLocation();
  if (storedLocation && hasMissingLocation(payload.learningPath)) payload.learningPath = storedLocation;
  return payload;
}

export default function ImportWaygroundReportPage() {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<"saving" | "done" | "error">("saving");
  const [message, setMessage] = useState("Saving your Wayground result…");

  useEffect(() => onAuthStateChanged(auth, async user => {
    if (started.current) return;
    if (!user) {
      setState("error");
      setMessage("Please sign in to Maths n Me, then return to your Wayground result page. The extension will try again.");
      return;
    }
    started.current = true;
    try {
      const { reportId } = await reportsApi("", { method: "POST", body: JSON.stringify(readPayload()) });
      window.localStorage.removeItem("mathsnme-wayground-pending-location");
      history.replaceState(null, "", "/dashboard/reports/import");
      setState("done");
      setMessage("Your report is ready!");
      window.setTimeout(() => router.replace(`/dashboard/reports?new=${reportId}`), 900);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to save this report.");
    }
  }), [router]);

  const Icon = state === "saving" ? LoaderCircle : state === "done" ? CheckCircle2 : CircleAlert;
  return <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#fffcf5] px-6">
    <section className="w-full max-w-lg rounded-3xl border border-[#eadfb9] bg-white p-9 text-center shadow-xl">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${state === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
        <Icon size={32} className={state === "saving" ? "animate-spin" : ""} />
      </span>
      <h1 className="mt-5 text-2xl font-black text-slate-950">Wayground report</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
    </section>
  </main>;
}
