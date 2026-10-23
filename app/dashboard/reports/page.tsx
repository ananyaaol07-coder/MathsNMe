"use client";

import { onAuthStateChanged } from "firebase/auth";
import { CalendarDays, CheckCircle2, FileChartColumn, Gauge, Printer, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { reportsApi } from "@/lib/reports/client";
import type { WaygroundQuestion, WaygroundReportInput } from "@/lib/reports/wayground";

type SavedReport = WaygroundReportInput & { id: string };

function Metric({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Trophy; color: string }) {
  return <div className={`rounded-2xl p-4 ${color}`}><Icon size={19} /><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-70">{label}</p></div>;
}

function QuestionRow({ question }: { question: WaygroundQuestion }) {
  return <div className="grid gap-3 rounded-2xl border border-[#eadfb9] bg-white p-4 sm:grid-cols-[48px_1fr_auto] sm:items-center">
    <span className={`flex h-11 w-11 items-center justify-center rounded-full font-black text-white ${question.correct ? "bg-green-500" : "bg-red-500"}`}>{question.number}</span>
    <div><p className="font-black text-slate-900">{question.prompt}</p><p className="mt-1 text-sm text-slate-500">Your answer: <b className="text-slate-800">{question.studentAnswer}</b> · Correct answer: <b className="text-slate-800">{question.correctAnswer}</b></p></div>
    <span className="text-sm font-bold text-slate-500">{question.timeSeconds === null ? "—" : `${question.timeSeconds}s`}</span>
  </div>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selected, setSelected] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { const result = await reportsApi(); setReports(result.reports); setSelected(current => current ?? result.reports[0] ?? null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load reports."); }
    finally { setLoading(false); }
  };
  useEffect(() => onAuthStateChanged(auth, user => { if (user) void load(); else setLoading(false); }), []);

  return <main className="min-h-screen bg-[#fffcf5] px-5 py-10 text-slate-900 sm:px-8 print:bg-white print:p-0">
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7200]">Your learning record</p><h1 className="mt-2 text-4xl font-black tracking-tight">Reports</h1><p className="mt-2 text-slate-600">Wayground results appear here automatically after each completed quiz.</p></div>
        <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8c98e] bg-white px-4 py-2.5 text-sm font-bold"><RefreshCw size={16} />Refresh</button>
      </header>
      {error && <p className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
      {loading ? <p className="mt-12 text-slate-500">Loading reports…</p> : reports.length === 0 ? <section className="mt-10 rounded-3xl border border-dashed border-[#d8c98e] bg-white p-12 text-center"><FileChartColumn className="mx-auto text-[#B8860B]" size={42}/><h2 className="mt-4 text-xl font-black">No reports yet</h2><p className="mt-2 text-sm text-slate-500">Complete a Wayground quiz with the extension enabled. Your report will be saved here.</p></section> : <div className="mt-9 grid gap-7 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3 print:hidden">{reports.map(report => <button key={report.id} onClick={() => setSelected(report)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === report.id ? "border-[#D4AF37] bg-[#fff8df]" : "border-[#e8dfc8] bg-white hover:border-[#D4AF37]"}`}><p className="font-black">{report.quizTitle}</p><p className="mt-1 text-xs text-slate-500">{new Date(report.capturedAt).toLocaleString()}</p><p className="mt-3 text-sm font-bold text-green-700">{report.accuracy}% accuracy</p></button>)}</aside>
        {selected && <article className="rounded-3xl border border-[#eadfb9] bg-white p-6 shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-col gap-5 border-b border-[#eee7d5] pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a7200]">Achievement report</p><h2 className="mt-2 text-3xl font-black">{selected.quizTitle}</h2><p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={15}/>{new Date(selected.capturedAt).toLocaleString()}</p></div><div className="flex items-center gap-3"><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[10px] border-green-500 bg-white"><b className="text-3xl">{selected.accuracy}%</b><span className="text-[10px] font-black text-slate-500">ACCURACY</span></div><button onClick={() => window.print()} className="rounded-xl border border-[#d8c98e] p-3 print:hidden" aria-label="Print or save this report as PDF"><Printer size={19}/></button></div></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Correct answers" value={`${selected.correct} / ${selected.total}`} icon={CheckCircle2} color="bg-green-50 text-green-800"/><Metric label="Average speed" value={selected.averageSeconds === null ? "—" : `${selected.averageSeconds}s`} icon={Gauge} color="bg-blue-50 text-blue-800"/><Metric label="Best streak" value={selected.bestStreak === null ? "—" : String(selected.bestStreak)} icon={Trophy} color="bg-purple-50 text-purple-800"/><Metric label="Wayground score" value={selected.score === null ? "—" : selected.score.toLocaleString()} icon={FileChartColumn} color="bg-amber-50 text-amber-800"/></div>
          {selected.questions.length > 0 && <section className="mt-8"><h3 className="text-xl font-black">Question review</h3><div className="mt-4 space-y-3">{selected.questions.map(question => <QuestionRow key={`${question.number}-${question.prompt}`} question={question}/>)}</div></section>}
        </article>}
      </div>}
    </div>
  </main>;
}
