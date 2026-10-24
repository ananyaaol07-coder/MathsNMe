"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CommitmentCard, practiceApi, usePractice } from "./PracticeProvider";
import { VEDIC_LEVEL_1_LINKS } from "@/lib/vedic/links";
type Worksheet = { id: string; title: string; topicId: string; levelId: number; questionCount: number };
type Session = { sessionId: string; title: string; questions: { id: string; prompt: string }[] };
type Result = { accuracy: number; correct: number; total: number; bonus: number; onTime: boolean };
export default function PracticeWorksheets({ worksheetId, topicId, levelId }: { worksheetId?: string; topicId?: string; levelId?: number }) {
  const isVedic = topicId === "vedic-maths";
  const { refresh } = usePractice();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completedVedic, setCompletedVedic] = useState<number[]>([]);
  useEffect(() => {
    if (!isVedic || levelId !== 1) return;
    let active = true;
    const syncReports = async () => {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });
        const data = await response.json() as { reports?: { learningPath?: { activityId?: string } }[] };
        if (!active) return;
        const completed = (data.reports || []).map(report => VEDIC_LEVEL_1_LINKS.findIndex(item => item.code === report.learningPath?.activityId)).filter(index => index >= 0);
        setCompletedVedic([...new Set(completed)]);
      } catch { /* The extension may not have submitted a report yet. */ }
    };
    void syncReports();
    const timer = window.setInterval(() => { void syncReports(); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isVedic, levelId]);
  function openVedicWorksheet(item: (typeof VEDIC_LEVEL_1_LINKS)[number]) {
    window.localStorage.setItem("mathsnme-wayground-pending-location", JSON.stringify({ grade: null, moduleId: "vedic-maths", moduleTitle: "Vedic Mathematics", chapterId: "level-1", chapterTitle: "Level 1", exerciseId: "worksheets", exerciseTitle: "Level 1 worksheets", activityId: item.code, activityTitle: item.code }));
    window.open(item.url, "_blank", "noopener,noreferrer");
  }
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await practiceApi("/worksheets"); setWorksheets(data.worksheets); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load worksheets."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  async function start(id: string) {
    setBusy(true); setError("");
    try { setSession(await practiceApi("/sessions", { action: "start", worksheetId: id })); setAnswers({}); setResult(null); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to start worksheet."); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session || busy) return; setBusy(true); setError("");
    try { setResult(await practiceApi("/sessions", { action: "complete", sessionId: session.sessionId, answers })); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to submit. Your answers are kept here; retry this submission."); }
    finally { setBusy(false); }
  }
  const visible = worksheets.filter(item => (!worksheetId || item.id === worksheetId) && (!topicId || item.topicId === topicId) && (!levelId || item.levelId === levelId));
  return <main className="min-h-screen bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF8EA] px-5 py-10 text-slate-900"><div className="mx-auto max-w-6xl"><Link href={isVedic ? "/topics/vedic-maths" : "/dashboard"} className="font-bold text-[#9a7200] underline">← {isVedic ? "Vedic Maths" : "Dashboard"}</Link>{isVedic ? <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-[#302914] via-[#1e1d19] to-[#111827] p-8 text-white shadow-xl sm:p-10"><p className="text-xs font-black uppercase tracking-widest text-[#f5d86f]">Vedic Mathematics</p><h1 className="mt-4 text-4xl font-black">Level {levelId} practice</h1><p className="mt-4 max-w-2xl leading-7 text-slate-300">Build speed and accuracy through focused worksheets. Complete this level to unlock the next stage.</p></section> : <><h1 className="mt-5 text-3xl font-black">Daily practice</h1><CommitmentCard /></>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error} {!session && <button onClick={load} className="underline">Retry</button>}</p>}
    {result ? <section role="status" className="mt-6 rounded-3xl border border-[#eadfb9] bg-white p-7"><h2 className="text-2xl font-bold">Worksheet complete!</h2><p className="mt-3">{result.correct} / {result.total} correct · {result.accuracy}% accuracy</p><p className="mt-4 text-lg font-bold text-[#9a7200]">{result.bonus === 70 ? "On time! +70 coins and one more streak day." : "Practice saved. No extra streak or coin bonus for this submission."}</p><p className="mt-3 text-sm leading-6 text-slate-600">The daily bonus is awarded once, when a worksheet is completed within your commitment window. Extra practice is always welcome. A missed window resets your streak and costs up to 20 coins.</p><button onClick={() => { setSession(null); setResult(null); setAnswers({}); }} className="mt-5 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold">Choose another worksheet</button></section>
    : session ? <form onSubmit={submit} className="mt-6 rounded-3xl border border-[#eadfb9] bg-white p-7"><h2 className="text-2xl font-bold">{session.title}</h2><p className="mt-3 text-sm leading-6 text-slate-500">Answer every question, then submit. The server’s receipt time determines your completion window, so leave a little time for submission. Sessions expire after 24 hours.</p><fieldset disabled={busy} className="mt-6 space-y-6">{session.questions.map((question, index) => <label key={question.id} className="block font-semibold"><span>{index + 1}. {question.prompt}</span><input value={answers[question.id] || ""} onChange={event => setAnswers(previous => ({ ...previous, [question.id]: event.target.value }))} required maxLength={200} autoComplete="off" className="mt-2 block w-full rounded-xl border border-[#eadfb9] p-3" /></label>)}<button className="rounded-xl bg-[#D4AF37] px-5 py-3 font-bold disabled:opacity-50" disabled={busy}>{busy ? "Submitting…" : "Complete worksheet"}</button></fieldset></form>
    : <section className="mt-6">{isVedic && levelId === 1 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{VEDIC_LEVEL_1_LINKS.map((item, index) => { const unlocked = index === 0 || completedVedic.includes(index - 1); const completed = completedVedic.includes(index); return <article key={item.code} className={`flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm ${unlocked ? "border-[#e8dfc8]" : "border-slate-200 opacity-65"}`}><div><span className="text-xs font-black uppercase tracking-widest text-[#B8860B]">Worksheet {index + 1}</span><h2 className="mt-3 text-lg font-black text-slate-950">{item.code}</h2><p className="mt-2 text-sm text-slate-500">{completed ? "Completed" : unlocked ? "Ready to start" : "Complete the previous worksheet first"}</p></div><div className="mt-6"><button type="button" disabled={!unlocked || completed} onClick={() => openVedicWorksheet(item)} className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-bold ${unlocked && !completed ? "bg-[#fff1b8] text-[#8a6500]" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}>{completed ? "Completed" : unlocked ? "Start" : "Locked"}</button></div></article>; })}</div> : loading ? <p>Loading worksheets…</p> : visible.length ? visible.map(item => <article key={item.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-[#eadfb9] bg-white p-6 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.topicId} · Level {item.levelId} · {item.questionCount} questions</p></div><button onClick={() => start(item.id)} disabled={busy} className="rounded-xl bg-[#D4AF37] px-5 py-3 font-bold disabled:opacity-50">{busy ? "Please wait…" : "Start worksheet"}</button></article>) : <div className="rounded-2xl border border-[#eadfb9] bg-white p-6"><h2 className="text-xl font-bold">No published worksheets yet</h2><p className="mt-3 leading-6 text-slate-600">Please contact MathsNMe to make your worksheets available.</p></div>}</section>}
  </div></main>;
}
