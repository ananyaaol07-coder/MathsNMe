"use client";

import { doc, getDocFromServer, serverTimestamp, setDoc } from "firebase/firestore";
import { CheckCircle2, ChevronDown, Flame, Trophy, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { type AdminStudent, dateLabel, timestampMillis } from "@/lib/admin/students";
import type { ReportLocation, WaygroundQuestion } from "@/lib/reports/wayground";

type Commitment = { streak: number; coins: number; worksheetsDone: number; successfulDays: number; xp?: number; minutesCompleted?: number; weeklyMinutes?: number; activitiesCompleted?: number };
type Report = { id: string; quizTitle: string; capturedAt: number; accuracy: number; correct: number; total: number; score: number | null; averageSeconds: number | null; bestStreak: number | null; questions: WaygroundQuestion[]; learningPath?: ReportLocation };
type ActivityEntry = { id: string; worksheetId: string | null; activity: string | null; grade: number | null; path: string[] | null; completedAt: number; result: { accuracy?: number; correct?: number; total?: number; passed?: boolean } | null };
type LearningRecord = { commitment: Commitment | null; reports: Report[]; activity: { practiceSessions: number; ibSessions: number; practiceHistory: ActivityEntry[]; ibHistory: ActivityEntry[] } };
type Tab = "record" | "activity" | "reports";

function Stat({ label, value, Icon, tone = "bg-[#fff4cc] text-[#8a6500]" }: { label: string; value: string; Icon: typeof Zap; tone?: string }) {
  return <div className={`rounded-2xl p-4 ${tone}`}><Icon size={19}/><p className="mt-3 text-2xl font-black">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-70">{label}</p></div>;
}

function reportTitle(report: Report) {
  const path = report.learningPath;
  if (!path) return report.quizTitle;
  const chapterNumber = path.chapterTitle.match(/chapter\s*(\d+)/i)?.[1] || path.chapterId.match(/chapter-(\d+)/)?.[1];
  if (chapterNumber && path.activityId === "chapter-pre-test") return `Chapter ${chapterNumber} pre-test`;
  if (chapterNumber && path.activityId === "chapter-post-test") return `Chapter ${chapterNumber} post-test`;
  return path.activityTitle && !/not set/i.test(path.activityTitle) ? path.activityTitle : report.quizTitle;
}

function learningPathLabel(report: Report) {
  const path = report.learningPath;
  if (!path) return "Learning path not recorded";
  const programme = path.moduleId === "vedic-maths" || /^L[123][-]/i.test(path.activityId || "") ? "Vedic Mathematics" : "IB Mathematics";
  return [programme, path.grade ? `Grade ${path.grade}` : null, path.moduleTitle, path.chapterTitle, path.exerciseTitle, reportTitle(report)].filter(Boolean).join(" · ");
}

function ActivityHistory({ title, entries }: { title: string; entries: ActivityEntry[] }) {
  return <div className="rounded-2xl border border-[#eadfb9] bg-[#fffcf5] p-5"><h4 className="font-black">{title}</h4>{entries.length === 0 ? <p className="mt-3 text-sm text-slate-500">No completed activities recorded.</p> : <div className="mt-3 space-y-2">{entries.map(entry => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 text-sm"><span className="font-semibold">{entry.activity || entry.worksheetId || "Completed activity"}</span><span className="text-slate-500">{entry.result?.accuracy === undefined ? "Completed" : `${Math.round(entry.result.accuracy)}%`} · {new Date(entry.completedAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span></div>)}</div>}</div>;
}

function AdminReports({ reports }: { reports: Report[] }) {
  const [selected, setSelected] = useState<Report | null>(null);
  return <section className="mt-8"><p className="text-xs font-bold uppercase tracking-widest text-[#9a7200]">Reports</p><h3 className="mt-2 text-2xl font-black">All student reports</h3>{selected ? <article className="mt-6 rounded-3xl border border-[#eadfb9] bg-[#fffcf5] p-6"><button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-bold text-[#8a6500]"><ChevronDown className="rotate-90" size={16}/>Back to all reports</button><h4 className="mt-5 text-2xl font-black">{reportTitle(selected)}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{learningPathLabel(selected)}</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Accuracy" value={`${selected.accuracy}%`} Icon={CheckCircle2} tone="bg-green-50 text-green-700"/><Stat label="Correct answers" value={`${selected.correct}/${selected.total}`} Icon={CheckCircle2} tone="bg-[#eafbf0] text-green-800"/><Stat label="Wayground score" value={selected.score === null ? "—" : selected.score.toLocaleString()} Icon={Trophy}/><Stat label="Average speed" value={selected.averageSeconds === null ? "—" : `${selected.averageSeconds}s`} Icon={Zap} tone="bg-purple-50 text-purple-700"/></div><p className="mt-5 text-sm text-slate-500">Completed {new Date(selected.capturedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>{selected.questions?.length ? <div className="mt-7"><h5 className="font-black">Question review</h5><div className="mt-3 space-y-3">{selected.questions.map(question => <div key={`${question.number}-${question.prompt}`} className="rounded-2xl border border-[#eadfb9] bg-white p-4"><p className="font-bold">{question.number}. {question.prompt}</p><p className="mt-2 text-sm text-slate-600">Student answer: <b>{question.studentAnswer}</b> · Correct answer: <b>{question.correctAnswer}</b></p></div>)}</div></div> : <p className="mt-7 rounded-2xl bg-white p-4 text-sm text-slate-500">Wayground did not provide individual answer details for this report.</p>}</article> : <><p className="mt-2 text-sm text-slate-500">{reports.length ? `${reports.length} saved report${reports.length === 1 ? "" : "s"}` : "No reports saved yet."}</p>{reports.length ? <div className="mt-5 overflow-x-auto rounded-2xl border border-[#eadfb9]"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#fffcf5] text-xs uppercase tracking-wide text-slate-500"><tr>{["Report", "Programme and learning path", "Accuracy", "Score", "Completed", ""].map(label => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{reports.map(report => <tr key={report.id} className="border-t border-slate-100"><td className="px-5 py-4 font-bold">{reportTitle(report)}</td><td className="max-w-xl px-5 py-4 leading-6 text-slate-600">{learningPathLabel(report)}</td><td className="px-5 py-4 text-green-700">{report.accuracy}% ({report.correct}/{report.total})</td><td className="px-5 py-4">{report.score === null ? "—" : report.score.toLocaleString()}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{new Date(report.capturedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td className="px-5 py-4"><button onClick={() => setSelected(report)} className="rounded-lg border border-[#e5d391] px-3 py-2 font-bold text-[#8a6500] hover:bg-[#fff4cc]">View report</button></td></tr>)}</tbody></table></div> : null}</>}</section>;
}

export default function StudentReview({ student, onClose }: { student: AdminStudent; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [tab, setTab] = useState<Tab>("record");
  const [notes, setNotes] = useState(""); const [reviewed, setReviewed] = useState(false); const [savedAt, setSavedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [loadError, setLoadError] = useState(false); const [message, setMessage] = useState(""); const [dirty, setDirty] = useState(false);
  const [record, setRecord] = useState<LearningRecord | null>(null); const [recordLoading, setRecordLoading] = useState(true); const [recordError, setRecordError] = useState("");
  useEffect(() => { headingRef.current?.focus(); }, []);
  useEffect(() => {
    let active = true;
    getDocFromServer(doc(db, "adminReviews", student.id)).then(snapshot => {
      if (!active) return; const data = snapshot.data(); setNotes(typeof data?.notes === "string" ? data.notes : ""); setReviewed(data?.reviewed === true); setSavedAt(timestampMillis(data?.updatedAt));
    }).catch(() => { if (active) { setLoadError(true); setMessage("Unable to load the existing review. Close and reopen this student to retry."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [student.id]);
  useEffect(() => {
    let active = true;
    async function loadRecord() {
      try {
        const token = await auth.currentUser?.getIdToken(); if (!token) throw new Error("Sign in again to load this learning record.");
        const response = await fetch(`/api/admin/students/${encodeURIComponent(student.id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load the learning record."); if (active) setRecord(data);
      } catch (error) { if (active) setRecordError(error instanceof Error ? error.message : "Unable to load the learning record."); }
      finally { if (active) setRecordLoading(false); }
    }
    void loadRecord(); return () => { active = false; };
  }, [student.id]);
  useEffect(() => { if (!dirty) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!auth.currentUser || loading || loadError) return; setSaving(true); setMessage("");
    try { await setDoc(doc(db, "adminReviews", student.id), { notes: notes.trim(), reviewed, reviewedBy: auth.currentUser.uid, updatedAt: serverTimestamp() }); setSavedAt(Date.now()); setDirty(false); setMessage("Review saved."); }
    catch { setMessage("Review could not be saved. Your notes are still here; please try again."); } finally { setSaving(false); }
  }
  const details = [["Email", student.guardianEmail], ["Phone", student.phone], ["Grade", student.grade === null ? "" : String(student.grade)], ["Board", student.board], ["Country", student.country], ["State", student.state], ["City", student.city], ["Registered", dateLabel(student.createdAt)], ["Learning policy", student.policyAccepted ? "Accepted" : "Not recorded"]];
  const commitment = record?.commitment;
  const tabs: { id: Tab; label: string }[] = [{ id: "record", label: "Student record" }, { id: "activity", label: "Learning activity" }, { id: "reports", label: "Reports" }];
  return <section aria-labelledby="review-heading" className="rounded-3xl border border-[#eadfb9] bg-white p-6 shadow-sm sm:p-8">
    <button disabled={saving} onClick={() => { if (!dirty || window.confirm("Discard unsaved review changes?")) onClose(); }} className="text-sm font-bold text-[#8a6500] hover:underline disabled:opacity-50">← Back to students</button>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#9a7200]">Student record</p><h2 id="review-heading" tabIndex={-1} ref={headingRef} className="mt-2 text-3xl font-black tracking-tight text-slate-950 outline-none">{student.studentName}</h2></div><span className="rounded-full bg-[#fff4cc] px-4 py-2 text-sm font-bold text-[#8a6500]">Grade {student.grade ?? "—"}</span></div>
    <nav aria-label="Student record sections" className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-[#eadfb9] bg-[#fffcf5] p-1.5">{tabs.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`rounded-xl px-5 py-3 text-sm font-bold ${tab === item.id ? "bg-[#fff1b8] text-[#8a6500] shadow-sm" : "text-slate-500 hover:bg-white"}`}>{item.label}</button>)}</nav>
    {tab === "record" && <div className="mt-8 grid gap-8 lg:grid-cols-2"><div><h3 className="font-bold text-slate-900">Registration details</h3><dl className="mt-4 grid gap-5 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{value || "Not recorded"}</dd></div>)}</dl></div><form onSubmit={save} className="rounded-2xl border border-slate-200 p-5 sm:p-6"><h3 className="font-bold text-slate-900">Admin review</h3><p className="mt-2 text-sm text-slate-500">Private notes, visible only to authorised admins.</p>{loading ? <p role="status" className="mt-5 text-sm">Loading review…</p> : <><label className="mt-5 block text-sm font-semibold text-slate-700">Review notes<textarea value={notes} onChange={event => { setNotes(event.target.value); setDirty(true); setMessage(""); }} maxLength={5000} rows={7} disabled={loadError || saving} placeholder="Observations, support needed, or points to follow up…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#D4AF37]/20" /></label><p className="mt-1 text-right text-xs text-slate-400">{notes.length} / 5,000</p><label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={reviewed} disabled={loadError || saving} onChange={event => { setReviewed(event.target.checked); setDirty(true); setMessage(""); }} className="h-4 w-4 accent-[#B8860B]" />Mark this student as reviewed</label><button disabled={loadError || saving || !dirty} className="mt-5 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{saving ? "Saving…" : "Save review"}</button></>}{message && <p role="status" className="mt-4 text-sm text-slate-700">{message}</p>}{savedAt !== null && <p className="mt-4 text-xs text-slate-500">Last saved: {dateLabel(savedAt)}</p>}</form></div>}
    {tab === "activity" && <section className="mt-8"><p className="text-xs font-bold uppercase tracking-widest text-[#9a7200]">Learning activity</p><h3 className="mt-2 text-2xl font-black">Progress and rewards</h3>{recordLoading ? <p role="status" className="mt-6 text-sm text-slate-500">Loading learning record…</p> : recordError ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{recordError}</p> : <><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Current streak" value={`${commitment?.streak ?? 0} days`} Icon={Flame} tone="bg-orange-50 text-orange-700"/><Stat label="Coins" value={String(commitment?.coins ?? 0)} Icon={Trophy}/><Stat label="XP" value={`${commitment?.xp ?? 0} XP`} Icon={Zap} tone="bg-purple-50 text-purple-700"/><Stat label="Activities done" value={String(commitment?.activitiesCompleted ?? 0)} Icon={CheckCircle2} tone="bg-green-50 text-green-700"/></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-3"><p className="rounded-xl bg-slate-50 p-4"><b>{commitment?.weeklyMinutes ?? 0}</b><span className="ml-1 text-slate-500">minutes this week</span></p><p className="rounded-xl bg-slate-50 p-4"><b>{commitment?.minutesCompleted ?? 0}</b><span className="ml-1 text-slate-500">minutes completed</span></p><p className="rounded-xl bg-slate-50 p-4"><b>{record?.activity.ibSessions ?? 0}</b><span className="ml-1 text-slate-500">completed IB activities</span></p></div></>}</section>}
    {tab === "activity" && !recordLoading && !recordError && <div className="mt-7 grid gap-5 lg:grid-cols-2"><ActivityHistory title="IB Mathematics activity" entries={record?.activity.ibHistory || []}/><ActivityHistory title="Vedic Mathematics activity" entries={record?.activity.practiceHistory || []}/></div>}
    {tab === "reports" && (recordLoading ? <p role="status" className="mt-8 text-sm text-slate-500">Loading learning record…</p> : recordError ? <p role="alert" className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">{recordError}</p> : <AdminReports reports={record?.reports || []}/>)}
  </section>;
}
