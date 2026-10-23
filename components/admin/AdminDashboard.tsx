"use client";

import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { GraduationCap, Search, ShieldCheck, Users, ClipboardCheck, LogOut, Menu, X, CreditCard, Gift, BarChart3, PieChart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/common/BrandLogo";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { type AdminStudent, type StudentFilters, dateLabel, defaultFilters, filterStudents, levelLabel, parseStudent } from "@/lib/admin/students";
import StudentReview from "./StudentReview";
import ContactRequests from "./ContactRequests";
import IBAccessRequests from "./IBAccessRequests";
import WebinarRegistrations from "./WebinarRegistrations";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
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
  const completedPretests = students.filter(student => student.pretestCompleted).length;
  const pendingPretests = Math.max(0, students.length - completedPretests);
  const maxLevelCount = Math.max(1, ...[...new Set(students.map(student => student.currentLevel))].map(level => students.filter(student => student.currentLevel === level).length));
  const gradeCounts = Array.from({ length: 12 }, (_, index) => ({ grade: index + 1, count: students.filter(student => student.grade === index + 1).length }));
  async function logout() {
    setSigningOut(true);
    try { await signOut(auth); router.replace("/admin/login"); }
    catch { setError("Unable to sign out. Please try again."); setSigningOut(false); }
  }
  const navigation = [{ label: "Contact requests", section: "contact-requests", Icon: ClipboardCheck }, { label: "IB grade requests", section: "ib-access", Icon: ClipboardCheck }, { label: "Overview", section: "overview", Icon: GraduationCap }, { label: "Webinar registrations", section: "webinars", Icon: Users }, { label: "Payments", section: "payments", Icon: CreditCard }, { label: "Students", section: "students", Icon: ClipboardCheck }, { label: "Goodies", section: "goodies", Icon: Gift }];
  const sectionCopy = {
    "contact-requests": ["Account settings", "Family contact changes.", "Review requests to update student contact details."],
    "ib-access": ["IB Mathematics", "Additional grade access.", "Review requests to practise other grades."],
    overview: ["Admin workspace", "Your students, at a glance.", "Monitor learning activity and key student metrics."],
    webinars: ["Webinar registrations", "Parent webinar sessions.", "Review bookings, send Zoom details, and mark completed sessions."],
    payments: ["Payments", "Payment activity.", "Review enrollment payments and account activation status."],
    students: ["Students", "Your student records.", "Search students, review learning levels, and update placement notes."],
    goodies: ["Goodies", "Resources for your MathsNMe community.", "Manage future learning resources and student rewards."],
  }[activeSection as "contact-requests" | "ib-access" | "overview" | "webinars" | "payments" | "students" | "goodies"];
  return <div className="min-h-screen bg-[#fffcf5] text-slate-900">
    <header className="border-b border-[#eadfb9] bg-white"><div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-8"><div className="flex items-center gap-3"><button aria-label="Open admin menu" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-[#eadfb9] p-2"><Menu size={21} /></button><Link href="/" className="flex items-center"><BrandLogo priority /></Link></div><div className="flex items-center gap-4"><span className="hidden items-center gap-2 text-sm font-semibold text-[#8a6500] sm:flex"><ShieldCheck size={18} />Admin</span><button onClick={logout} disabled={signingOut || !!selected} title={selected ? "Return to the student list before signing out" : undefined} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><LogOut size={16} />{signingOut ? "Signing out…" : "Sign out"}</button></div></div></header>
    <div className="mx-auto flex max-w-[1440px]">
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[min(360px,88vw)] flex-col border-r border-[#eadfb9] bg-[#fffdf7] p-7 shadow-2xl transition-transform`}><div className="flex items-center justify-between"><Image src="/mathsnme-hero-original.png" alt="MathsNMe" width={64} height={64} className="h-16 w-16 object-contain" /><button aria-label="Close admin menu" onClick={() => setSidebarOpen(false)} className="rounded-xl bg-[#fff4cc] p-2 text-[#9a7200] hover:bg-[#ffedaa]"><X size={21} /></button></div><div className="mt-9 flex items-center gap-3 border-b border-[#eadfb9] pb-7"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4cc] text-lg font-bold text-[#9a7200]">A</span><div><p className="font-bold text-slate-900">Admin</p><p className="text-sm text-slate-500">MathsNMe workspace</p></div></div><nav className="mt-8 flex-1 space-y-2" aria-label="Admin navigation"><p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.16em] text-[#9a7200]">Workspace</p>{navigation.map(({ label, section, Icon }) => <button key={label} type="button" onClick={() => { setActiveSection(section); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold ${activeSection === section ? "bg-[#D4AF37] text-slate-950" : "text-slate-700 hover:bg-[#fff8df] hover:text-[#8a6500]"}`}><Icon size={19} className="text-[#9a7200]" />{label}</button>)}</nav><button onClick={logout} disabled={signingOut || !!selected} className="flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3.5 text-sm font-bold text-slate-950 hover:bg-[#c79d18] disabled:opacity-50"><LogOut size={17} />{signingOut ? "Signing out…" : "Sign out"}</button></aside>
      {sidebarOpen && <button aria-label="Close admin menu overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-sm" />}
    <div className="min-w-0 flex-1 px-5 py-10 sm:px-8">
      <div id="overview" />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7200]">{sectionCopy[0]}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{sectionCopy[1]}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{sectionCopy[2]}</p>
      <div className={`${activeSection === "overview" ? "" : "hidden"} my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>{[
        { label: "Registered students", value: students.length, Icon: Users },
        { label: "Webinars conducted", value: "—", Icon: Users },
        { label: "Total worksheets", value: 57, Icon: ClipboardCheck },
        { label: "Average practice time", value: "Not tracked", Icon: GraduationCap },
        { label: "Pre-test completed", value: students.filter(student => student.pretestCompleted).length, Icon: ClipboardCheck },
        { label: "Level assigned", value: students.filter(student => student.currentLevel > 0).length, Icon: GraduationCap },
      ].map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-[#eadfb9] bg-white p-5"><span className="rounded-xl bg-[#fff4cc] p-3 text-[#9a7200]"><Icon size={24} /></span><div><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 font-black ${typeof value === "number" ? "text-3xl" : "text-xl"}`}>{loading || error ? "—" : value}</p></div></div>)}</div>
      <div className={`${activeSection === "overview" ? "" : "hidden"} mb-8 grid gap-5 lg:grid-cols-2`}>
        <section className="rounded-3xl border border-[#eadfb9] bg-white p-6" aria-labelledby="pretest-chart-title"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#fff4cc] p-3 text-[#9a7200]"><PieChart size={22} /></span><div><h2 id="pretest-chart-title" className="font-bold">Pre-test completion</h2><p className="text-sm text-slate-500">Student assessment status</p></div></div><div className="mt-6 flex items-center gap-8"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: students.length ? `conic-gradient(#D4AF37 0 ${completedPretests / students.length * 100}%, #eef0f3 ${completedPretests / students.length * 100}% 100%)` : "#eef0f3" }}><div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-2xl font-black">{students.length ? `${Math.round(completedPretests / students.length * 100)}%` : "—"}</div></div><div className="space-y-3 text-sm"><p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#D4AF37]" />Completed <strong>{completedPretests}</strong></p><p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-slate-200" />Pending <strong>{pendingPretests}</strong></p></div></div></section>
        <section className="rounded-3xl border border-[#eadfb9] bg-white p-6" aria-labelledby="level-chart-title"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#fff4cc] p-3 text-[#9a7200]"><BarChart3 size={22} /></span><div><h2 id="level-chart-title" className="font-bold">Students by level</h2><p className="text-sm text-slate-500">Current learning placement</p></div></div><div className="mt-6 space-y-3">{[0, ...levels].filter((level, index, values) => values.indexOf(level) === index).sort((a, b) => a - b).map(level => { const count = students.filter(student => student.currentLevel === level).length; return <div key={level} className="flex items-center gap-3 text-sm"><span className="w-20 shrink-0 text-slate-600">{level === 0 ? "Unassigned" : `Level ${level}`}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-[#f3f0e6]"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${count / maxLevelCount * 100}%` }} /></div><strong className="w-6 text-right">{count}</strong></div> })}</div></section>
      </div>
      <section className={`${activeSection === "overview" ? "" : "hidden"} mb-8 rounded-3xl border border-[#eadfb9] bg-white p-6`} aria-labelledby="grade-chart-title"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#fff4cc] p-3 text-[#9a7200]"><BarChart3 size={22} /></span><div><h2 id="grade-chart-title" className="font-bold">Grade distribution</h2><p className="text-sm text-slate-500">Registered students by grade</p></div></div><div className="mt-7 flex h-48 items-end gap-2 overflow-x-auto border-b border-slate-100 pb-0 sm:gap-4">{gradeCounts.map(({ grade, count }) => <div key={grade} className="flex h-full min-w-7 flex-1 flex-col items-center justify-end gap-2 text-xs text-slate-500"><span className="font-semibold text-slate-700">{count || ""}</span><div className="w-full rounded-t-lg bg-[#D4AF37] transition-all" style={{ height: `${count ? Math.max(8, count / Math.max(1, ...gradeCounts.map(item => item.count)) * 100) : 3}%`, opacity: count ? 1 : 0.2 }} /><span className="pb-2">{grade}</span></div>)}</div></section>
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={() => { setLoading(true); setError(""); setAttempt(value => value + 1); }} className="ml-3 font-bold underline">Retry</button></div>}
      <div id="webinar-registrations" className={activeSection === "webinars" ? "block" : "hidden"}><WebinarRegistrations /></div>
      {activeSection === "students" && (selected ? <StudentReview key={selected.id} student={selected} onClose={() => setSelectedId(null)} /> : <>
        <section id="students" aria-label="Student filters" className="rounded-t-3xl border border-[#eadfb9] bg-white p-6">
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
      </>)}
      {activeSection === "ib-access" && <IBAccessRequests />}
      {activeSection === "contact-requests" && <ContactRequests />}
      {activeSection === "payments" && <WebinarRegistrations paymentsOnly />}
      {activeSection === "goodies" && <section id="goodies" className="mt-8 rounded-3xl border border-[#eadfb9] bg-white p-6"><h2 className="text-xl font-bold">Goodies</h2><p className="mt-2 text-sm text-slate-500">Goodies and resources will appear here.</p></section>}
    </div></div>
  </div>;
}
