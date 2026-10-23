"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Layers3, LockKeyhole } from "lucide-react";
import StudentMenu from "@/components/layout/StudentMenu";
import BrandLogo from "@/components/common/BrandLogo";
import { ibApi } from "@/lib/ib/client";
export { ibApi } from "@/lib/ib/client";
import IBActivities, { type ActivityCard } from "./IBActivities";
import type { AccessStatus } from "@/lib/ib/curriculum";
type View = {
  activities?: ActivityCard[];
  registeredGrade: number; grade?: number; chapterTests?: boolean;
  grades?: { grade: number; own: boolean; previous: boolean; automatic: boolean; accessible: boolean; status: AccessStatus | null }[];
  breadcrumbs?: { id: string; title: string }[];
  children?: { id: string; title: string; completed: boolean; unlocked: boolean }[];
  exercise?: { title: string; practiceRequired: boolean; completed: boolean } | null;
};
const base = "/topics/ib-mathematics";
export default function IBSection({ path = [] }: { path?: string[] }) {
  const key = path.join("/");
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { const result = await ibApi(`/api/ib?path=${encodeURIComponent(key)}`); setView(result); setError(""); }
    catch (error) { setView(null); setError(error instanceof Error ? error.message : "Unable to load IB Mathematics."); }
    finally { setLoading(false); }
  }, [key]);
  useEffect(() => {
    const first = setTimeout(() => { setLoading(true); void load(); }, 0);
    const timer = setInterval(() => { void load(); }, 30000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [load]);
  async function requestGrade(grade: number) {
    setSaving(grade); setNotice("");
    try { await ibApi("/api/ib", { grade }); setNotice(`Grade ${grade} access requested. Your admin will review it.`); await load(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to send request."); }
    finally { setSaving(null); }
  }
  const level = path.length;
  const childLabel = ["Grade", "Module", "Chapter", "Exercise"][level];
  const title = !level ? "A world of mathematical thinking." : view?.exercise?.title || view?.breadcrumbs?.at(-1)?.title || `Grade ${view?.grade || path[0]}`;
  return <div className="min-h-screen bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF8EA] text-slate-900">
    <header className="border-b border-[#eadfb9] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><div className="flex items-center gap-4"><StudentMenu /><Link href="/dashboard"><BrandLogo className="w-36" /></Link></div><Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft size={16} /> Dashboard</Link></div></header>
    <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
      <nav aria-label="IB Mathematics breadcrumb" className="mb-7 flex flex-wrap gap-2 text-sm text-slate-500"><Link href={base} className="transition hover:text-[#9a7200] hover:underline">IB Mathematics</Link>{level > 0 && <><span>/</span><Link href={`${base}/${path[0]}`} className="transition hover:text-[#9a7200] hover:underline">Grade {path[0]}</Link></>}{view?.breadcrumbs?.map((crumb, index) => <span className="contents" key={crumb.id}><span>/</span><Link href={`${base}/${path.slice(0, index + 2).join("/")}`} className="transition hover:text-[#9a7200] hover:underline">{crumb.title}</Link></span>)}</nav>
      <section className="rounded-[2rem] bg-gradient-to-br from-[#302914] via-[#1e1d19] to-[#111827] p-8 text-white sm:p-10"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#f5d86f]"><BookOpen size={17} /> IB Mathematics</p><h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{!level ? "Your current grade and the grade immediately below it are included automatically. You can request admin approval for any other grade." : level === 1 ? view?.chapterTests ? "This revision grade includes chapter tests. Pass a chapter test to clear it, or complete its exercises after an unsuccessful attempt." : "This is your current learning grade. Complete every exercise in sequence to finish each chapter." : level === 3 ? view?.chapterTests ? "Start with the chapter test. If more practice is needed, complete the exercises below before trying again." : "Chapter tests are not used in your current grade. Complete every exercise below in order." : level === 4 ? "Each exercise contains a pre-test, ten worksheets and a post-test. A successful pre-test clears the exercise; otherwise complete the worksheets and pass the post-test." : "Complete the chapters in order."}</p></section>
      {notice && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error} <button onClick={load} className="font-bold underline">Retry</button></p>}
      {loading ? <p role="status" className="mt-8">Loading your learning path…</p> : view && <>
        {!level && <><div className="mb-5 mt-8 flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-bold">Choose your grade</h2><p className="text-sm text-slate-500">Registered grade: {view.registeredGrade}</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{view.grades?.map(item => <article key={item.grade} className={`flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${item.accessible ? "border-[#e8d8a8]" : "border-[#e8dfc8]"}`}><div className="flex items-center justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${item.accessible ? "bg-[#fff1b8] text-[#9a7200]" : "bg-[#faf8f2] text-[#9a8c69]"}`}>{item.grade}</span>{item.accessible ? <BookOpen size={19} className="text-[#b37d00]" /> : <LockKeyhole size={19} className="text-slate-400" />}</div><h3 className="mt-5 text-xl font-bold">Grade {item.grade}</h3><p className="mb-6 mt-2 text-sm text-slate-500">{item.own ? "Current grade · exercises required" : item.previous ? "Revision grade · chapter tests available" : item.accessible ? "Admin-approved access" : item.status === "pending" ? "Awaiting admin approval" : item.status === "rejected" ? "Request declined · contact admin" : "Explore with admin approval"}</p>{item.accessible ? <Link href={`${base}/${item.grade}`} className="mt-auto flex items-center justify-between rounded-xl bg-[#fff4cc] px-4 py-3 text-sm font-bold text-[#8a6500]">Explore grade <ArrowRight size={16} /></Link> : <button disabled={saving !== null || !!item.status} onClick={() => requestGrade(item.grade)} className="mt-auto rounded-xl border border-[#e5d391] px-3 py-3 text-sm font-bold text-[#8a6500] disabled:opacity-50">{saving === item.grade ? "Sending…" : item.status === "pending" ? "Request pending" : item.status === "rejected" ? "Contact admin" : "Request access"}</button>}</article>)}</div></>}
        {!!view.activities?.length && <IBActivities key={key} grade={view.grade!} path={path.slice(1)} items={view.activities} onComplete={load} />}
        {level > 0 && level < 4 && <section className="mt-8"><h2 className="text-2xl font-bold">{childLabel}s</h2>{view.children?.length ? <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{view.children.map((item, index) => <article key={item.id} className={`rounded-3xl border bg-white p-6 ${item.unlocked ? "border-[#e8d8a8] shadow-sm" : "border-[#e8dfc8]"}`}><div className="flex items-center justify-between"><span className="rounded-xl bg-[#fff4cc] p-3 text-[#9a7200]"><Layers3 size={22} /></span>{item.completed ? <CheckCircle2 className="text-green-600" size={21} /> : !item.unlocked && <LockKeyhole className="text-slate-400" size={21} />}</div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{childLabel} {index + 1}</p><h3 className="mt-2 text-xl font-bold">{item.title}</h3>{item.unlocked ? <Link href={`${base}/${key}/${item.id}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#fff4cc] px-4 py-3 text-sm font-bold text-[#8a6500] transition hover:bg-[#fff1b8]">{item.completed ? "Review" : "Explore"} <ArrowRight size={16} /></Link> : <p className="mt-5 text-sm leading-6 text-slate-500">{level === 3 && view.chapterTests ? "Take the chapter test first, then complete the previous exercise." : `Complete the previous ${childLabel?.toLowerCase()} to unlock.`}</p>}</article>)}</div> : <div className="mt-5 rounded-3xl border border-[#eadfb9] bg-white p-8"><h3 className="text-xl font-bold">Your learning path is being prepared</h3><p className="mt-3 leading-7 text-slate-500">{childLabel}s will appear here when the curriculum is added.</p></div>}</section>}

      </>}
    </main>
  </div>;
}
