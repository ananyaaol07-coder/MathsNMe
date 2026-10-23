"use client";

import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Clock3, FileChartColumn, Folder, Gauge, Printer, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { reportsApi } from "@/lib/reports/client";
import type { ReportLocation, WaygroundQuestion, WaygroundReportInput } from "@/lib/reports/wayground";

type SavedReport = WaygroundReportInput & { id: string };
type FolderSegment = { key: string; label: string };

function reportFolders(report: SavedReport): FolderSegment[] {
  const path: ReportLocation | undefined = report.learningPath;
  if (!path) return [{ key: "unfiled", label: "Needs organising" }];
  return [
    { key: path.grade ? `grade-${path.grade}` : "grade-unset", label: path.grade ? `Grade ${path.grade}` : "Grade not set" },
    { key: path.moduleId, label: path.moduleTitle }, { key: path.chapterId, label: path.chapterTitle },
    { key: path.exerciseId, label: path.exerciseTitle }, { key: path.activityId, label: path.activityTitle },
  ];
}

function Metric({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Trophy; color: string }) {
  return <div className={`rounded-2xl p-4 ${color}`}><Icon size={19}/><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-70">{label}</p></div>;
}

function ReportButton({ report, active, onClick }: { report: SavedReport; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-[#D4AF37] bg-[#fff8df]" : "border-[#e8dfc8] bg-white hover:border-[#D4AF37]"}`}>
    <p className="font-black">{report.quizTitle}</p><p className="mt-1 text-xs text-slate-500">{reportFolders(report).at(-1)?.label} · {new Date(report.capturedAt).toLocaleString()}</p><p className="mt-3 text-sm font-bold text-green-700">{report.accuracy}% accuracy</p>
  </button>;
}

function QuestionRow({ question }: { question: WaygroundQuestion }) {
  return <div className="grid gap-3 rounded-2xl border border-[#eadfb9] bg-white p-4 sm:grid-cols-[48px_1fr_auto] sm:items-center"><span className={`flex h-11 w-11 items-center justify-center rounded-full font-black text-white ${question.correct ? "bg-green-500" : "bg-red-500"}`}>{question.number}</span><div><p className="font-black text-slate-900">{question.prompt}</p><p className="mt-1 text-sm text-slate-500">Your answer: <b className="text-slate-800">{question.studentAnswer}</b> · Correct answer: <b className="text-slate-800">{question.correctAnswer}</b></p></div><span className="text-sm font-bold text-slate-500">{question.timeSeconds === null ? "—" : `${question.timeSeconds}s`}</span></div>;
}

function ReportDetail({ report }: { report: SavedReport }) {
  return <article className="rounded-3xl border border-[#eadfb9] bg-white p-6 shadow-sm sm:p-8 print:border-0 print:p-0 print:shadow-none">
    <div className="flex flex-col gap-5 border-b border-[#eee7d5] pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#9a7200]">Achievement report</p><h2 className="mt-2 text-3xl font-black">{report.quizTitle}</h2><p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500"><CalendarDays size={15}/>{new Date(report.capturedAt).toLocaleString()}<span>·</span>{reportFolders(report).map(item => item.label).join(" › ")}</p></div><div className="flex items-center gap-3"><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[10px] border-green-500 bg-white"><b className="text-3xl">{report.accuracy}%</b><span className="text-[10px] font-black text-slate-500">ACCURACY</span></div><button onClick={() => window.print()} className="rounded-xl border border-[#d8c98e] p-3 print:hidden" aria-label="Print or save this report as PDF"><Printer size={19}/></button></div></div>
    <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Correct answers" value={`${report.correct} / ${report.total}`} icon={CheckCircle2} color="bg-green-50 text-green-800"/><Metric label="Average speed" value={report.averageSeconds === null ? "—" : `${report.averageSeconds}s`} icon={Gauge} color="bg-blue-50 text-blue-800"/><Metric label="Best streak" value={report.bestStreak === null ? "—" : String(report.bestStreak)} icon={Trophy} color="bg-purple-50 text-purple-800"/><Metric label="Wayground score" value={report.score === null ? "—" : report.score.toLocaleString()} icon={FileChartColumn} color="bg-amber-50 text-amber-800"/></div>
    {report.questions.length > 0 && <section className="mt-8"><h3 className="text-xl font-black">Question review</h3><div className="mt-4 space-y-3">{report.questions.map(question => <QuestionRow key={`${question.number}-${question.prompt}`} question={question}/>)}</div></section>}
  </article>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]), [selected, setSelected] = useState<SavedReport | null>(null);
  const [mode, setMode] = useState<"recent" | "folders">("recent"), [folderPath, setFolderPath] = useState<FolderSegment[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const result = await reportsApi(); setReports(result.reports); setSelected(current => result.reports.find((item: SavedReport) => item.id === current?.id) ?? result.reports[0] ?? null); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load reports."); } finally { setLoading(false); } };
  useEffect(() => onAuthStateChanged(auth, user => { if (user) void load(); else setLoading(false); }), []);

  const folderReports = useMemo(() => reports.filter(report => folderPath.every((segment, index) => reportFolders(report)[index]?.key === segment.key)), [reports, folderPath]);
  const folders = useMemo(() => { const index = folderPath.length, values = new Map<string, FolderSegment & { count: number }>(); for (const report of folderReports) { const segment = reportFolders(report)[index]; if (!segment) continue; const previous = values.get(segment.key); values.set(segment.key, { ...segment, count: (previous?.count || 0) + 1 }); } return [...values.values()]; }, [folderPath.length, folderReports]);
  const atLeaf = folderPath.length >= 5 || (folders.length === 0 && folderPath.length > 0);
  const leafSelection = selected && folderReports.some(report => report.id === selected.id) ? selected : folderReports[0] || null;

  return <main className="min-h-screen bg-[#fffcf5] px-5 py-10 text-slate-900 sm:px-8 print:bg-white print:p-0"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7200]">Your learning record</p><h1 className="mt-2 text-4xl font-black tracking-tight">Reports</h1><p className="mt-2 text-slate-600">Find recent results quickly or browse them inside their learning folders.</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8c98e] bg-white px-4 py-2.5 text-sm font-bold"><RefreshCw size={16}/>Refresh</button></header>
    <div className="mt-8 flex gap-2 rounded-2xl border border-[#eadfb9] bg-white p-1.5 print:hidden"><button onClick={() => { setMode("recent"); setFolderPath([]); }} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black ${mode === "recent" ? "bg-[#fff1b8] text-[#8a6500]" : "text-slate-500"}`}><Clock3 size={17}/>Recents</button><button onClick={() => { setMode("folders"); setFolderPath([]); }} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black ${mode === "folders" ? "bg-[#fff1b8] text-[#8a6500]" : "text-slate-500"}`}><Folder size={17}/>Learning folders</button></div>
    {error && <p className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
    {loading ? <p className="mt-12 text-slate-500">Loading reports…</p> : reports.length === 0 ? <section className="mt-10 rounded-3xl border border-dashed border-[#d8c98e] bg-white p-12 text-center"><FileChartColumn className="mx-auto text-[#B8860B]" size={42}/><h2 className="mt-4 text-xl font-black">No reports yet</h2><p className="mt-2 text-sm text-slate-500">Complete a Wayground quiz with the extension enabled. Your report will be saved here.</p></section> : mode === "recent" ? <div className="mt-7 grid gap-7 lg:grid-cols-[320px_1fr]"><aside className="space-y-3 print:hidden">{reports.map(report => <ReportButton key={report.id} report={report} active={selected?.id === report.id} onClick={() => setSelected(report)}/>)}</aside>{selected && <ReportDetail report={selected}/>}</div> : <section className="mt-7 print:hidden">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><button onClick={() => setFolderPath([])} className="hover:text-[#8a6500]">All grades</button>{folderPath.map((segment, index) => <span className="contents" key={`${segment.key}-${index}`}><ChevronRight size={15}/><button onClick={() => setFolderPath(folderPath.slice(0, index + 1))} className="hover:text-[#8a6500]">{segment.label}</button></span>)}</nav>
      {folderPath.length > 0 && <button onClick={() => setFolderPath(folderPath.slice(0, -1))} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#e8dfc8] bg-white px-4 py-2 text-sm font-bold"><ArrowLeft size={15}/>Back</button>}
      {!atLeaf ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{folders.map(folder => <button key={folder.key} onClick={() => setFolderPath([...folderPath, folder])} className="group flex items-center gap-4 rounded-2xl border border-[#e8dfc8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4cc] text-[#9a7200]"><Folder size={24}/></span><span className="min-w-0 flex-1"><b className="block truncate">{folder.label}</b><span className="mt-1 block text-xs text-slate-500">{folder.count} {folder.count === 1 ? "report" : "reports"}</span></span><ChevronRight className="text-slate-400" size={19}/></button>)}</div> : <div className="grid gap-7 lg:grid-cols-[320px_1fr]"><aside className="space-y-3">{folderReports.map(report => <ReportButton key={report.id} report={report} active={leafSelection?.id === report.id} onClick={() => setSelected(report)}/>)}</aside>{leafSelection && <ReportDetail report={leafSelection}/>}</div>}
    </section>}
  </div></main>;
}
