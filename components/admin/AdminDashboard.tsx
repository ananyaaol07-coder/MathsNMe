"use client";

import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { GraduationCap, Search, ShieldCheck, Users, ClipboardCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { type AdminStudent, type StudentFilters, dateLabel, defaultFilters, filterStudents, levelLabel, parseStudent } from "@/lib/admin/students";
import StudentReview from "./StudentReview";

const fieldClass = "mt-2 w-full rounded-xl border border-[#e5dcc5] bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#D4AF37]/20";
const pageSize = 20;
export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<StudentFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => onSnapshot(collection(db, "users"), { includeMetadataChanges: true }, snapshot => {
    if (snapshot.metadata.fromCache) return;
    setStudents(snapshot.docs.map(document => parseStudent(document.id, document.data())));
    setLoading(false); setError("");
  }, () => { setStudents([]); setSelectedId(null); setError("Unable to load student records. Check your connection and admin permissions, then retry."); setLoading(false); }), [attempt]);
  function updateFilter(key: keyof StudentFilters, value: string) { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); }
  const filtered = filterStudents(students, filters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = students.find(student => student.id === selectedId);
  const boards = [...new Set(students.map(student => student.board).filter(Boolean))].sort();
  const levels = [...new Set(students.map(student => student.currentLevel))].sort((a, b) => a - b);
  async function logout() {
    setSigningOut(true);
    try { await signOut(auth); router.replace("/admin/login"); }
    catch { setError("Unable to sign out. Please try again."); setSigningOut(false); }
  }
  return <div className="min-h-screen bg-[#fffcf5] text-slate-900">
    <header className="border-b border-[#eadfb9] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5"><Link href="/" className="text-2xl font-black tracking-tight">MathsNMe<span className="text-[#a47a10]">.</span></Link><div className="flex items-center gap-5"><span className="flex items-center gap-2 text-sm font-semibold text-[#8a6500]"><ShieldCheck size={18} />Admin</span><button onClick={logout} disabled={signingOut || !!selected} title={selected ? "Return to the student list before signing out" : undefined} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><LogOut size={16} />{signingOut ? "Signing out…" : "Sign out"}</button></div></div></header>
    <div className="mx-auto max-w-7xl px-6 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7200]">Admin workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your students, at a glance.</h1><p className="mt-3 text-sm leading-6 text-slate-500">Review registrations, check learning levels, and keep track of each student.</p>
      <div className="my-8 grid gap-4 sm:grid-cols-3">{[
        { label: "Registered students", value: students.length, Icon: Users },
        { label: "Pre-test completed", value: students.filter(student => student.pretestCompleted).length, Icon: ClipboardCheck },
        { label: "Level assigned", value: students.filter(student => student.currentLevel > 0).length, Icon: GraduationCap },
      ].map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-[#eadfb9] bg-white p-5"><span className="rounded-xl bg-[#fff4cc] p-3 text-[#9a7200]"><Icon size={24} /></span><div><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{loading || error ? "—" : value}</p></div></div>)}</div>
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={() => { setLoading(true); setError(""); setAttempt(value => value + 1); }} className="ml-3 font-bold underline">Retry</button></div>}
      {selected ? <StudentReview key={selected.id} student={selected} onClose={() => setSelectedId(null)} /> : <>
        <section aria-label="Student filters" className="rounded-t-3xl border border-[#eadfb9] bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4"><label className="w-full max-w-md text-sm font-semibold">Search students<div className="relative"><Search size={18} className="absolute left-3 top-5 text-slate-400" /><input type="search" value={filters.search} onChange={event => updateFilter("search", event.target.value)} placeholder="Search by student name or email" className={`${fieldClass} pl-10`} /></div></label><button onClick={() => { setFilters(defaultFilters); setPage(1); }} className="text-sm font-bold text-[#8a6500] hover:underline">Clear filters</button></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-semibold text-slate-500">Grade<select value={filters.grade} onChange={event => updateFilter("grade", event.target.value)} className={fieldClass}><option value="">All grades</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Grade {i + 1}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-500">Board<select value={filters.board} onChange={event => updateFilter("board", event.target.value)} className={fieldClass}><option value="">All boards</option>{boards.map(board => <option key={board}>{board}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-500">Level<select value={filters.level} onChange={event => updateFilter("level", event.target.value)} className={fieldClass}><option value="">All levels</option>{[...new Set([0, ...levels])].map(level => <option key={level} value={level}>{levelLabel(level)}</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-500">Pre-test<select value={filters.pretest} onChange={event => updateFilter("pretest", event.target.value)} className={fieldClass}><option value="">All students</option><option value="pending">Pending</option><option value="completed">Completed</option></select></label>
            <label className="text-xs font-semibold text-slate-500">Sort by<select value={filters.sort} onChange={event => updateFilter("sort", event.target.value)} className={fieldClass}><option value="newest">Newest registered</option><option value="name">Name A–Z</option><option value="level">Highest level</option></select></label>
          </div>
        </section>
        <section aria-label="Registered students" className="overflow-hidden rounded-b-3xl border border-t-0 border-[#eadfb9] bg-white">
          {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading registered students…</p> : error ? <p className="p-10 text-center text-sm text-slate-500">Student records are unavailable.</p> : filtered.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto text-[#bca65f]" size={32} /><h2 className="mt-4 text-lg font-bold">{students.length === 0 ? "No students registered yet" : "No matching students"}</h2><p className="mt-2 text-sm text-slate-500">{students.length === 0 ? "New registrations will appear here automatically." : "Try another name or adjust the filters."}</p></div> : <><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><caption className="sr-only">Registered students and their current learning placement</caption><thead className="border-b border-[#eadfb9] bg-[#fffcf5] text-xs uppercase tracking-wider text-slate-500"><tr>{["Student", "Grade / Board", "Level", "Pre-test", "Registered", "Review"].map(label => <th scope="col" key={label} className="px-6 py-4 font-semibold">{label}</th>)}</tr></thead><tbody>{visible.map(student => <tr key={student.id} className="border-b border-slate-100 last:border-0 hover:bg-[#fffcf5]"><td className="max-w-64 px-6 py-5"><p className="break-words font-bold">{student.studentName}</p><p className="mt-1 break-words text-xs text-slate-500">{student.guardianEmail || "Email not recorded"}</p></td><td className="px-6 py-5"><p>{student.grade === null ? "Not recorded" : `Grade ${student.grade}`}</p><p className="mt-1 text-xs text-slate-500">{student.board || "—"}</p></td><td className="whitespace-nowrap px-6 py-5 font-semibold">{levelLabel(student.currentLevel)}</td><td className="px-6 py-5"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.pretestCompleted ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{student.pretestCompleted ? "Completed" : "Pending"}</span></td><td className="whitespace-nowrap px-6 py-5 text-slate-500">{dateLabel(student.createdAt)}</td><td className="px-6 py-5"><button onClick={() => setSelectedId(student.id)} aria-label={`Review ${student.studentName}`} className="rounded-lg border border-[#e5d391] px-3 py-2 font-bold text-[#8a6500] hover:bg-[#fff4cc]">Review →</button></td></tr>)}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-xs text-slate-500"><p aria-live="polite">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} students</p><div className="flex items-center gap-4"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="font-bold disabled:opacity-30">Previous</button><span>Page {currentPage} of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="font-bold disabled:opacity-30">Next</button></div></div></>}
        </section>
      </>}
    </div>
  </div>;
}
