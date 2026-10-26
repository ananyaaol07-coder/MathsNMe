import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText } from "lucide-react";

const worksheets = [
  ["L1-BAS-CH03-EX01-S01", "Ready to start", "Start"],
  ["L1-BAS-CH03-EX01-S02", "Complete the previous worksheet first", "Locked"],
  ["L1-BAS-CH03-EX01-S03", "Complete the previous worksheet first", "Locked"],
  ["L1-BAS-CH03-EX01-S04", "Complete the previous worksheet first", "Locked"],
  ["L1-BAS-CH03-EX02-S01", "Complete the previous worksheet first", "Locked"],
  ["L1-BAS-CH03-EX02-S02", "Complete the previous worksheet first", "Locked"],
];

export default function VedicLevelPage() {
  return <main className="min-h-screen bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF8EA] text-slate-900">
    <header className="border-b border-[#e8dfc8] bg-white"><div className="mx-auto flex min-h-[72px] max-w-5xl items-center gap-4 px-6"><Link href="/vedic-preview" className="flex items-center gap-2 text-sm font-bold text-slate-600"><ArrowLeft size={18}/> Vedic Mathematics</Link></div></header>
    <section className="mx-auto max-w-5xl px-6 py-10"><p className="text-xs font-black tracking-widest text-[#B8860B]">VEDIC MATHEMATICS · LEVEL 1</p><h1 className="mt-3 text-4xl font-black">Foundation</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Build number sense, learn complements, and practise quick addition at your own pace.</p><div className="mt-8 rounded-3xl border border-[#eadfb9] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="font-bold text-slate-500">Level progress</p><p className="mt-1 text-3xl font-black">0 / 8 worksheets</p></div><Clock3 className="text-[#B8860B]" size={30}/></div><div className="mt-6 h-2.5 rounded-full bg-slate-100"><div className="h-full w-0 rounded-full bg-[#D4AF37]"/></div></div><div className="mt-8 grid gap-4">{worksheets.map(([title,description,time], index)=><article key={title} className="flex items-center gap-4 rounded-2xl border border-[#eadfb9] bg-white p-5 shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff1b8] font-black text-[#9a7200]">{index + 1}</span><div className="min-w-0 flex-1"><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div><button disabled={index !== 0} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${index === 0 ? "bg-[#fff1b8] text-[#8a6500]" : "bg-slate-100 text-slate-400"}`}>{time}{index === 0 && <ArrowRight size={16}/>}</button></article>)}</div><div className="mt-8 rounded-2xl border border-[#e8dfc8] bg-white p-5 text-sm leading-6 text-slate-600"><CheckCircle2 className="mb-2 text-emerald-600" size={20}/><b className="text-slate-900">Complete worksheets in order.</b> Your progress will appear here as you work through the level.</div></section>
  </main>;
}
