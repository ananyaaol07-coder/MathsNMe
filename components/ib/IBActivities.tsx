"use client";
import { useState } from "react";
import { CheckCircle2, FileText, LockKeyhole } from "lucide-react";
import { ibApi } from "@/lib/ib/client";
import type { Criteria } from "@/lib/ib/curriculum";
export type ActivityCard = { id: string; title: string; available: boolean; complete: boolean; reason: string; configured: boolean; criteria: Criteria | null };
type Session = { sessionId: string; title: string; criteria: Criteria | null; questions: { id: string; prompt: string; points: number }[] };
type Result = { passed: boolean; score: number; accuracy: number; seconds: number; bonus: number; activity: string };
export default function IBActivities({ grade, path, items, onComplete }: { grade: number; path: string[]; items: ActivityCard[]; onComplete: () => Promise<void> }) {
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start(activity: string) {
    setBusy(true); setError("");
    try { setSession(await ibApi("/api/ib/activities", { action: "start", grade, path, activity })); setAnswers({}); setResult(null); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to start."); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session || busy) return;
    setBusy(true); setError("");
    try { setResult(await ibApi("/api/ib/activities", { action: "complete", sessionId: session.sessionId, answers })); await onComplete(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to submit. Your answers are kept here; please retry."); }
    finally { setBusy(false); }
  }
  return <section className="mt-8"><h2 className="text-2xl font-bold">{path.length === 3 ? "Exercise activities" : "Start with the chapter test"}</h2>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {result ? <div role="status" className="mt-5 rounded-3xl border border-[#e8d8a8] bg-white p-7"><h3 className="text-xl font-bold">{result.activity.startsWith("worksheet-") ? "Worksheet completed" : result.passed ? "Test passed!" : "More practice needed"}</h3><p className="mt-3">Score: {result.score.toFixed(1)}% · Accuracy: {result.accuracy.toFixed(1)}% · Time: {result.seconds}s</p><p className="mt-3 leading-7 text-slate-600">{result.activity.startsWith("worksheet-") ? "Your practice has been recorded." : result.passed ? "You can move on. Practice is still available whenever you want." : result.activity === "post-test" ? "Complete all 10 worksheets again before your next post-test attempt." : result.activity === "chapter-test" ? "Work through every exercise, then return to this chapter test." : "Complete all 10 worksheets, then take the exercise post-test."}</p>{result.bonus > 0 && <p className="mt-3 font-bold text-[#9a7200]">+{result.bonus} coins for on-time daily practice!</p>}<button onClick={() => { setResult(null); setSession(null); }} className="mt-5 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold">Continue</button></div>
    : session ? <form onSubmit={submit} className="mt-5 rounded-3xl border border-[#e8d8a8] bg-white p-7"><h3 className="text-xl font-bold">{session.title}</h3>{session.criteria && <p className="mt-3 rounded-xl bg-[#fff8df] p-4 text-sm leading-6">Pass criteria: at least {session.criteria.minScore}% score and {session.criteria.minAccuracy}% accuracy, within {session.criteria.maxSeconds} seconds. Timing starts when you open the test and includes submission time.</p>}<p className="mt-3 text-sm text-slate-500">Answer every question. Keep this page open until you submit.</p><fieldset disabled={busy} className="mt-5 space-y-5">{session.questions.map((q, i) => <label key={q.id} className="block font-semibold">{i + 1}. {q.prompt} <span className="text-sm text-slate-500">({q.points} marks)</span><input required maxLength={200} autoComplete="off" value={answers[q.id] || ""} onChange={event => setAnswers(previous => ({ ...previous, [q.id]: event.target.value }))} className="mt-2 block w-full rounded-xl border border-[#eadfb9] p-3" /></label>)}<button className="rounded-xl bg-[#D4AF37] px-5 py-3 font-bold disabled:opacity-50">{busy ? "Saving…" : "Submit answers"}</button></fieldset></form>
    : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} className="rounded-2xl border border-[#e8dfc8] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#fff4cc] p-3 text-[#9a7200]"><FileText size={20} /></span><h3 className="font-bold">{item.title}</h3>{item.complete && <CheckCircle2 size={18} className="text-green-700" />}</div><p className="mt-4 text-sm leading-6 text-slate-600">{item.reason}</p>{item.criteria && <p className="mt-3 text-xs leading-6 text-[#8a6500]">Score ≥ {item.criteria.minScore}% · Accuracy ≥ {item.criteria.minAccuracy}% · Time ≤ {item.criteria.maxSeconds}s</p>}<button disabled={busy || !item.available || !item.configured} onClick={() => start(item.id)} className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff4cc] px-4 py-3 text-sm font-bold text-[#8a6500] disabled:opacity-50">{!item.available && !item.complete && <LockKeyhole size={15} />}{item.complete && !item.available ? "Passed" : !item.available ? "Locked" : !item.configured ? "Being prepared" : item.id.startsWith("worksheet-") ? "Practise" : "Start test"}</button></article>)}</div>}
  </section>;
}
