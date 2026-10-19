"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Calculator,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  FileChartColumn,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Play,
  Settings,
  ShoppingBag,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

interface StudentProfile {
  studentName: string;
  grade: number;
  guardianEmail: string;
  currentLevel: number;
  pretestCompleted: boolean;
}

const vedicLevels = [
  { id: 1, title: "Foundation", description: "Number sense, complements, and quick addition", worksheets: 8 },
  { id: 2, title: "Fast Multiplication", description: "Core multiplication techniques and patterns", worksheets: 10 },
  { id: 3, title: "Smart Division", description: "Efficient division methods and divisibility", worksheets: 9 },
  { id: 4, title: "Squares & Roots", description: "Rapid squares, square roots, and identities", worksheets: 10 },
  { id: 5, title: "Fractions & Percentages", description: "Mental fractions, ratios, and percentages", worksheets: 8 },
  { id: 6, title: "Advanced Techniques", description: "Combined methods and timed challenges", worksheets: 12 },
];

const navigation = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Vedic Mathematics", icon: Calculator, href: "/topics/vedic-maths", active: true },
  { label: "IB Mathematics", icon: Brain, href: "/topics/ib-mathematics" },
  { label: "Olympiad", icon: Trophy, href: "/topics/olympiad", locked: true },
  { label: "Progress", icon: BarChart3, href: "/dashboard#progress" },
  { label: "Reports", icon: FileChartColumn, href: "/dashboard#reports" },
  { label: "Payments", icon: CreditCard, href: "/dashboard#payments" },
  { label: "Shop", icon: ShoppingBag, href: "/dashboard#shop" },
  { label: "Settings", icon: Settings, href: "/profile" },
];

export default function TopicPage() {
  const params = useParams<{ topicId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (!snapshot.exists()) {
          setError("Your student profile could not be found.");
          return;
        }
        setProfile(snapshot.data() as StudentProfile);
      } catch (caughtError) {
        console.error(caughtError);
        setError("Unable to load Vedic Mathematics right now.");
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeProfileMenu = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", closeProfileMenu);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  if (params.topicId !== "vedic-maths") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffcf5] px-6">
        <div className="max-w-md rounded-3xl border border-[#eadfb9] bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-slate-950">This learning page is coming next</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">We are currently building this programme.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffcf5]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#f0e4bf] border-t-[#B8860B]" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Loading Vedic Mathematics…</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffcf5] px-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-black text-slate-950">Page unavailable</h1>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const currentLevel = profile.currentLevel || 1;
  const hasPlacement = profile.pretestCompleted;
  const firstName = profile.studentName.split(" ")[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF8EA] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[850px] w-[850px] -translate-x-1/2 rounded-full bg-[#F7D65D]/10 blur-[140px]" />
        <div className="absolute right-0 top-52 h-96 w-96 rounded-full bg-[#FFECA8]/35 blur-[100px]" />
      </div>

      <header className="relative z-30 border-b border-[#e8dfc8] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-xl border border-[#e8dfc8] p-2.5 text-slate-600 transition hover:border-[#D4AF37] hover:bg-[#fff8e4] hover:text-slate-950"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <Menu size={22} />
            </button>
            <Link href="/dashboard" className="hidden items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-950 sm:flex">
              <ArrowLeft size={18} />
              Dashboard
            </Link>
          </div>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="MathsNMe" width={42} height={42} priority className="rounded-xl" />
            <span className="hidden text-xl font-black tracking-[-0.04em] sm:inline">MathsNMe</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-[#eadfb9] bg-[#fff9e8] px-3 py-2 text-sm font-black text-[#8a6500]" title="Experience points">
              <Sparkles size={16} />
              <span>0 XP</span>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ead28a] bg-[#fff1b8] font-black text-[#9a7200] shadow-sm transition hover:scale-105 hover:bg-[#ffeaa0]"
                aria-label={`Open ${profile.studentName}'s account menu`}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
              >
                {firstName.charAt(0).toUpperCase()}
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+12px)] z-50 w-60 overflow-hidden rounded-2xl border border-[#e8dfc8] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
                >
                  <div className="border-b border-[#eee7d5] px-3 py-3">
                    <p className="truncate text-sm font-black text-slate-950">{profile.studentName}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{profile.guardianEmail}</p>
                  </div>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                    className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#fff8e4]"
                  >
                    <UserRound size={18} />
                    Profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-slate-950/35 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col border-r border-[#e8dfc8] bg-white p-5 shadow-[18px_0_55px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!menuOpen}
      >
        <div className="mb-8 flex items-center justify-between border-b border-[#eee7d5] pb-5">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <Image src="/logo.png" alt="MathsNMe" width={42} height={42} className="rounded-xl" />
            <span className="text-xl font-black tracking-[-0.04em]">MathsNMe</span>
          </Link>
          <button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl border border-[#e8dfc8] p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950" aria-label="Close navigation menu">
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1.5" aria-label="Student navigation">
          {navigation.map(({ label, icon: Icon, href, active, locked }) =>
            locked ? (
              <button key={label} type="button" disabled title="Unlocks after 1 year of active learning" className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-400">
                <Icon size={19} />
                <span className="flex-1">{label}</span>
                <LockKeyhole size={15} />
              </button>
            ) : (
              <Link key={label} href={href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? "bg-[#fff4cc] text-[#8a6500]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                <Icon size={19} />
                {label}
              </Link>
            ),
          )}
        </nav>

        <div className="mt-auto border-t border-[#eee7d5] pt-4">
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50">
            <LogOut size={19} />
            Log out
          </button>
        </div>
      </aside>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#302914] via-[#1e1d19] to-[#111827] p-7 text-white shadow-xl sm:p-10">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/25 blur-3xl" />
            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black tracking-wide text-[#f5d86f]">
                <Calculator size={16} />
                VEDIC MATHEMATICS
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Calculate smarter. Think faster.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Build confidence and speed through structured Vedic techniques, focused worksheets, and regular practice.</p>
              <Link
                href={hasPlacement ? `/topics/vedic-maths/level/${currentLevel}` : "/topics/vedic-maths/pretest"}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3.5 font-black text-slate-950 transition hover:bg-[#e1bd43]"
              >
                {hasPlacement ? "Continue learning" : "Take the pre-test"}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e8dfc8] bg-white/95 p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1b8] text-[#a87400]"><Target size={23} /></div>
            <p className="mt-5 text-sm font-bold text-slate-500">Your placement</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{hasPlacement ? `Level ${currentLevel}` : "Not assessed"}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{hasPlacement ? "Continue with your recommended learning level." : "Complete the pre-test to identify the right starting level."}</p>
            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: hasPlacement ? `${Math.min((currentLevel / vedicLevels.length) * 100, 100)}%` : "0%" }} />
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Vedic Mathematics statistics">
          {[
            { label: "Current level", value: hasPlacement ? `Level ${currentLevel}` : "Not set", icon: Trophy, color: "bg-[#fff1b8] text-[#ae7900]" },
            { label: "Worksheets done", value: "0", icon: FileText, color: "bg-emerald-100 text-emerald-600" },
            { label: "Average accuracy", value: "—", icon: BarChart3, color: "bg-purple-100 text-purple-600" },
            { label: "Practice time", value: "0 min", icon: Clock3, color: "bg-blue-100 text-blue-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <article key={label} className="rounded-2xl border border-[#e8dfc8] bg-white/95 p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div>
              <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
            </article>
          ))}
        </section>

        <section className="mt-11" aria-labelledby="level-roadmap-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#B8860B]">YOUR ROADMAP</p>
              <h2 id="level-roadmap-heading" className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">Vedic Maths levels</h2>
            </div>
            <p className="text-sm text-slate-500">Progress one level at a time</p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vedicLevels.map((level) => {
              const isCurrent = hasPlacement && level.id === currentLevel;
              const isCompleted = hasPlacement && level.id < currentLevel;
              const isAvailable = hasPlacement && level.id <= currentLevel;

              const content = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black ${isCompleted ? "bg-emerald-100 text-emerald-600" : isCurrent ? "bg-[#fff1b8] text-[#9a7200]" : "bg-slate-100 text-slate-400"}`}>
                      {isCompleted ? <CheckCircle2 size={21} /> : level.id}
                    </span>
                    {isCurrent ? (
                      <span className="rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#8a6500]">CURRENT</span>
                    ) : !isAvailable ? (
                      <LockKeyhole size={18} className="text-slate-400" />
                    ) : null}
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-950">{level.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{level.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-[#eee7d5] pt-4 text-xs font-bold text-slate-500">
                    <span>{level.worksheets} worksheets</span>
                    {isAvailable && <span className="flex items-center gap-1 text-[#9a7200]"><Play size={14} fill="currentColor" /> Open level</span>}
                  </div>
                </>
              );

              return isAvailable ? (
                <Link key={level.id} href={`/topics/vedic-maths/level/${level.id}`} className="rounded-3xl border border-[#e2cf91] bg-white/95 p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg">{content}</Link>
              ) : (
                <article key={level.id} className="cursor-not-allowed rounded-3xl border border-slate-200 bg-white/65 p-6 opacity-75">{content}</article>
              );
            })}
          </div>

          {!hasPlacement && (
            <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#ead28a] bg-[#fff8df] p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-black text-slate-950">Levels are locked until placement</p>
                <p className="mt-1 text-sm text-slate-600">Take the Vedic Maths pre-test to unlock your recommended starting level.</p>
              </div>
              <Link href="/topics/vedic-maths/pretest" className="shrink-0 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-slate-950">Start pre-test</Link>
            </div>
          )}
        </section>

        <section className="mt-11 rounded-3xl border border-[#e8dfc8] bg-white/80 p-7">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#B8860B]" size={22} />
            <h2 className="text-xl font-black">Recent worksheets</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Your completed and active Vedic Maths worksheets will appear here after you begin your first level.</p>
        </section>
      </main>
    </div>
  );
}
