"use client";

import { onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, CheckCircle2, ChevronRight, Clock3, Download, FileChartColumn, Folder, Gauge, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { reportsApi } from "@/lib/reports/client";
import BrandLogo from "@/components/common/BrandLogo";
import type { ReportLocation, WaygroundQuestion, WaygroundReportInput } from "@/lib/reports/wayground";

type SavedReport = WaygroundReportInput & { id: string };
type FolderSegment = { key: string; label: string };

function reportProgramme(report: SavedReport): "ib" | "vm" {
  const path = report.learningPath;
  return path?.moduleId === "vedic-maths" || /^L[123][-]/i.test(path?.activityId || "") ? "vm" : "ib";
}

function activityName(report: SavedReport) {
  const activity = report.learningPath?.activityTitle;
  if (activity && !/not set/i.test(activity)) return activity;
  return report.quizTitle && !/^summary$/i.test(report.quizTitle) ? report.quizTitle : "Assessment";
}

function reportFolders(report: SavedReport): FolderSegment[] {
  const path: ReportLocation | undefined = report.learningPath;
  if (!path) return [{ key: "unfiled", label: "Needs organising" }];
  // A report belongs to the learning container in which the learner opened it.
  // Chapter assessments are shown directly inside their assessment folder, while
  // every exercise activity (pre-test, worksheet, or post-test) sits together in
  // that exercise's folder. The activity remains visible on the report card.
  return [{ key: reportProgramme(report), label: reportProgramme(report) === "vm" ? "Vedic Mathematics" : "IB Mathematics" },
    { key: path.grade ? `grade-${path.grade}` : "grade-unset", label: path.grade ? `Grade ${path.grade}` : "Grade not set" },
    { key: path.moduleId, label: path.moduleTitle }, { key: path.chapterId, label: path.chapterTitle },
    { key: path.exerciseId, label: path.exerciseTitle },
  ];
}

function Metric({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Trophy; color: string }) {
  return <div className={`rounded-2xl p-4 ${color}`}><Icon size={19}/><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-70">{label}</p></div>;
}

function ReportButton({ report, active, onClick }: { report: SavedReport; active: boolean; onClick: () => void }) {
  const title = activityName(report);
  const sourceTitle = report.quizTitle && report.quizTitle !== title ? `${report.quizTitle} · ` : "";
  return <button onClick={onClick} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-[#D4AF37] bg-[#fff8df]" : "border-[#e8dfc8] bg-white hover:border-[#D4AF37]"}`}>
    <p className="font-black">{title}</p><p className="mt-1 text-xs text-slate-500">{sourceTitle}{new Date(report.capturedAt).toLocaleString()}</p><p className="mt-3 text-sm font-bold text-green-700">{report.accuracy}% accuracy</p>
  </button>;
}

function QuestionRow({ question }: { question: WaygroundQuestion }) {
  return <div className="grid gap-3 rounded-2xl border border-[#eadfb9] bg-white p-4 sm:grid-cols-[48px_1fr_auto] sm:items-center"><span className={`flex h-11 w-11 items-center justify-center rounded-full font-black text-white ${question.correct ? "bg-green-500" : "bg-red-500"}`}>{question.number}</span><div><p className="font-black text-slate-900">{question.prompt}</p><p className="mt-1 text-sm text-slate-500">Your answer: <b className="text-slate-800">{question.studentAnswer}</b> · Correct answer: <b className="text-slate-800">{question.correctAnswer}</b></p></div><span className="text-sm font-bold text-slate-500">{question.timeSeconds === null ? "—" : `${question.timeSeconds}s`}</span></div>;
}

async function downloadReport(report: SavedReport) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to download this report.");
  const response = await fetch("/api/reports/download", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ id: report.id }) });
  if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Unable to create the PDF."); }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a"); link.href = url; link.download = `mathsnme-${report.quizTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "report"}.pdf`; link.click(); URL.revokeObjectURL(url);
}

function ReportDetail({ report }: { report: SavedReport }) {
  const passed = report.accuracy >= 90;
  const total = Math.min(Math.max(report.total, 1), 100);
  const answers = Array.from({ length: total }, (_, index) => report.questions[index]?.correct ?? index < report.correct);
  const date = new Date(report.capturedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const learningName = activityName(report);
  const praise = report.accuracy === 100 ? "A perfect result!" : passed ? "You cleared the 90% goal!" : "Keep practising — you are improving.";
  const nextStep = passed ? "You are ready to move to the next exercise!" : "Review this exercise, then try the test again.";
  return <article className="report-detail overflow-hidden rounded-3xl border border-[#eadfb9] bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
    <header className="flex items-center justify-between bg-slate-950 px-6 py-5 text-white sm:px-8"><BrandLogo className="w-36"/><p className="text-xs font-black tracking-wider text-slate-300">ACHIEVEMENT REPORT</p></header>
    <div className="p-5 sm:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#e9bd27] bg-[#fff9ea] p-6 sm:p-8"><span className="absolute left-3 top-6 h-2 w-2 rounded-full bg-green-500"/><span className="absolute left-6 top-14 h-2 w-2 rounded-full bg-violet-500"/><div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-3xl font-black tracking-tight sm:text-4xl">AMAZING WORK!</h2><p className={`mt-3 text-lg font-black ${passed ? "text-green-700" : "text-[#9a7200]"}`}>{praise}</p><p className="mt-5 text-sm text-slate-500">{learningName} <span className="mx-1">•</span> Completed {date}</p></div><div className="mx-auto flex h-40 w-40 flex-col items-center justify-center rounded-full border-[13px] bg-white" style={{ borderColor: passed ? "#22c55e" : "#d4af37" }}><b className="text-4xl">{report.accuracy}%</b><span className="mt-1 text-[10px] font-black tracking-wide text-slate-500">ACCURACY</span><span className={`mt-3 rounded-full px-6 py-1 text-xs font-black text-white ${passed ? "bg-green-500" : "bg-[#d4af37]"}`}>{passed ? "PASSED" : "KEEP GOING"}</span></div></div></section>
      <div className="mt-8 flex items-center justify-between"><h3 className="text-2xl font-black">Your performance at a glance</h3><button onClick={() => void downloadReport(report)} className="inline-flex items-center gap-2 rounded-xl border border-[#d8c98e] bg-white px-4 py-3 text-sm font-bold print:hidden" aria-label="Download this report as PDF"><Download size={18}/>Download PDF</button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Correct answers" value={`${report.correct} / ${report.total}`} icon={CheckCircle2} color="bg-[#eafbf0] text-green-800"/><Metric label="Average speed" value={report.averageSeconds === null ? "—" : `${report.averageSeconds} sec`} icon={Gauge} color="bg-[#eaf2ff] text-blue-800"/><Metric label="Best streak" value={report.bestStreak === null ? "—" : String(report.bestStreak)} icon={Trophy} color="bg-[#f1eaff] text-purple-800"/><Metric label="Wayground score" value={report.score === null ? "—" : report.score.toLocaleString()} icon={FileChartColumn} color="bg-[#fff9ea] text-[#8a6500]"/></div>
      <section className="mt-9"><h3 className="text-2xl font-black">Your {report.total}-question journey</h3><div className="mt-5 rounded-3xl border border-[#eadfb9] bg-slate-50 p-6"><div className="grid grid-cols-5 gap-3 sm:grid-cols-10">{answers.map((correct, index) => <span key={index} className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ${correct ? "bg-green-500" : "bg-red-500"}`}>{index + 1}</span>)}</div><p className={`mt-5 text-center text-sm font-bold ${passed ? "text-green-700" : "text-[#9a7200]"}`}>{passed ? "Every green circle is a correct answer — great work!" : "Review the red circles, then practise these questions again."}</p></div></section>
      <section className="mt-9"><h3 className="text-2xl font-black">What your result tells us</h3><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-3xl bg-[#eafbf0] p-6"><h4 className="font-black">{passed ? "Strong accuracy" : "A clear next step"}</h4><p className="mt-3 text-sm leading-6 text-slate-600">{passed ? `You answered ${report.correct} of ${report.total} questions correctly and cleared the 90% goal.` : `You answered ${report.correct} of ${report.total} questions correctly. A little more practice will build confidence.`}</p></div><div className="rounded-3xl bg-[#eaf2ff] p-6"><h4 className="font-black">{report.averageSeconds === null ? "Keep building speed" : "Quick thinking"}</h4><p className="mt-3 text-sm leading-6 text-slate-600">{report.averageSeconds === null ? "Wayground did not provide a timing average for this activity." : `An average of ${report.averageSeconds} seconds per question shows your current solving pace.`}</p></div></div></section>
      <section className="mt-8 rounded-3xl bg-slate-950 p-7 text-white"><p className="text-xs font-black tracking-wider text-[#f4c542]">NEXT ADVENTURE</p><h3 className="mt-3 text-2xl font-black">{nextStep}</h3><p className="mt-3 text-sm text-slate-300">Keep practising regularly to protect your speed and accuracy.</p></section>
      {report.questions.length > 0 && <section className="mt-9"><h3 className="text-2xl font-black">Question review</h3><div className="mt-4 space-y-3">{report.questions.map(question => <QuestionRow key={`${question.number}-${question.prompt}`} question={question}/>)}</div></section>}
    </div>
  </article>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]), [selected, setSelected] = useState<SavedReport | null>(null);
  const [mode, setMode] = useState<"recent" | "folders">("recent"), [folderPath, setFolderPath] = useState<FolderSegment[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState<"all" | "ib" | "vm">("all");
  const [resultFilter, setResultFilter] = useState<"all" | "passed" | "practice">("all");
  const load = async () => { setLoading(true); setError(""); try { const result = await reportsApi(); setReports(result.reports); setSelected(current => current ? result.reports.find((item: SavedReport) => item.id === current.id) ?? null : null); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load reports."); } finally { setLoading(false); } };
  useEffect(() => onAuthStateChanged(auth, user => { if (user) void load(); else setLoading(false); }), []);

  const filteredReports = useMemo(() => reports.filter(report => (programmeFilter === "all" || reportProgramme(report) === programmeFilter) && (resultFilter === "all" || (resultFilter === "passed" ? report.accuracy >= 90 : report.accuracy < 90))), [reports, programmeFilter, resultFilter]);
  const folderReports = useMemo(() => filteredReports.filter(report => folderPath.every((segment, index) => reportFolders(report)[index]?.key === segment.key)), [filteredReports, folderPath]);
  const folders = useMemo(() => {
    const index = folderPath.length;
    const values = new Map<string, FolderSegment & { count: number }>();
    if (index === 0) {
      values.set("ib", { key: "ib", label: "IB Mathematics", count: 0 });
      values.set("vm", { key: "vm", label: "Vedic Mathematics", count: 0 });
    }
    for (const report of folderReports) {
      const segment = reportFolders(report)[index];
      if (!segment) continue;
      const previous = values.get(segment.key);
      values.set(segment.key, { ...segment, count: (previous?.count || 0) + 1 });
    }
    return [...values.values()];
  }, [folderPath.length, folderReports]);
  const atLeaf = folderPath.length >= 5 || (folders.length === 0 && folderPath.length > 0);

  return <main id="report-print-root" className="min-h-screen bg-[#fffcf5] px-5 py-10 text-slate-900 sm:px-8 print:bg-white print:p-0"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#9a7200]">Your learning record</p><h1 className="mt-2 text-4xl font-black tracking-tight">Reports</h1><p className="mt-2 text-slate-600">Find recent results quickly or browse them inside their learning folders.</p></div><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8c98e] bg-white px-4 py-2.5 text-sm font-bold"><RefreshCw size={16}/>Refresh</button></header>
    {!selected && <><div className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-[#eadfb9] bg-white p-1.5 print:hidden"><button onClick={() => { setMode("recent"); setFolderPath([]); }} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black ${mode === "recent" ? "bg-[#fff1b8] text-[#8a6500]" : "text-slate-500"}`}><Clock3 size={17}/>Recents</button><button onClick={() => { setMode("folders"); setFolderPath([]); }} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black ${mode === "folders" ? "bg-[#fff1b8] text-[#8a6500]" : "text-slate-500"}`}><Folder size={17}/>Learning folders</button></div><div className="mt-4 flex flex-wrap gap-3 print:hidden"><label className="text-sm font-bold text-slate-600">Programme<select value={programmeFilter} onChange={event => { setProgrammeFilter(event.target.value as typeof programmeFilter); setFolderPath([]); }} className="ml-2 rounded-xl border border-[#eadfb9] bg-white px-3 py-2"><option value="all">All</option><option value="ib">IB Mathematics</option><option value="vm">Vedic Mathematics</option></select></label><label className="text-sm font-bold text-slate-600">Result<select value={resultFilter} onChange={event => setResultFilter(event.target.value as typeof resultFilter)} className="ml-2 rounded-xl border border-[#eadfb9] bg-white px-3 py-2"><option value="all">All results</option><option value="passed">Passed (90%+)</option><option value="practice">Needs practice</option></select></label></div></>}
    {error && <p className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
    {selected ? <section className="mt-7"><button onClick={() => setSelected(null)} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#e8dfc8] bg-white px-4 py-2 text-sm font-bold print:hidden"><ArrowLeft size={15}/>Back to reports</button><ReportDetail report={selected}/></section> : loading ? <p className="mt-12 text-slate-500">Loading reports…</p> : reports.length === 0 ? <section className="mt-10 rounded-3xl border border-dashed border-[#d8c98e] bg-white p-12 text-center"><FileChartColumn className="mx-auto text-[#B8860B]" size={42}/><h2 className="mt-4 text-xl font-black">No reports yet</h2><p className="mt-2 text-sm text-slate-500">Complete a Wayground quiz with the extension enabled. Your report will be saved here.</p></section> : mode === "recent" ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredReports.map(report => <ReportButton key={report.id} report={report} active={false} onClick={() => setSelected(report)}/>)}</div> : <section className="mt-7 print:hidden">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500"><button onClick={() => setFolderPath([])} className="hover:text-[#8a6500]">All reports</button>{folderPath.map((segment, index) => <span className="contents" key={`${segment.key}-${index}`}><ChevronRight size={15}/><button onClick={() => setFolderPath(folderPath.slice(0, index + 1))} className="hover:text-[#8a6500]">{segment.label}</button></span>)}</nav>
      {folderPath.length > 0 && <button onClick={() => setFolderPath(folderPath.slice(0, -1))} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[#e8dfc8] bg-white px-4 py-2 text-sm font-bold"><ArrowLeft size={15}/>Back</button>}
      {!atLeaf ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{folders.map(folder => <button key={folder.key} onClick={() => setFolderPath([...folderPath, folder])} className="group flex items-center gap-4 rounded-2xl border border-[#e8dfc8] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4AF37]"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4cc] text-[#9a7200]"><Folder size={24}/></span><span className="min-w-0 flex-1"><b className="block truncate">{folder.label}</b><span className="mt-1 block text-xs text-slate-500">{folder.count} {folder.count === 1 ? "report" : "reports"}</span></span><ChevronRight className="text-slate-400" size={19}/></button>)}</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{folderReports.map(report => <ReportButton key={report.id} report={report} active={false} onClick={() => setSelected(report)}/>)}</div>}
    </section>}
  </div></main>;
}
