"use client";

import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, sendEmailVerification, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Calculator,
  CircleAlert,
  Clock3,
  CreditCard,
  FileText,
  FileChartColumn,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MailCheck,
  Menu,
  ShoppingBag,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";

interface StudentProfile {
  studentName: string;
  grade: number;
  guardianEmail: string;
  currentLevel: number;
  pretestCompleted: boolean;
  role: "student";
}

const navigation = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "Vedic Mathematics", icon: Calculator, href: "/topics/vedic-maths/pretest" },
  { label: "IB Mathematics", icon: Brain, href: "/topics/ib-mathematics/pretest" },
  { label: "Olympiad", icon: Trophy, href: "/dashboard", locked: true },
  { label: "Progress", icon: BarChart3, href: "/dashboard#progress" },
  { label: "Reports", icon: FileChartColumn, href: "/dashboard#reports" },
  { label: "Payments", icon: CreditCard, href: "/dashboard#payments" },
  { label: "Shop", icon: ShoppingBag, href: "/dashboard#shop" },
  { label: "Settings", icon: Settings, href: "/profile" },
];

function DashboardLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffcf5]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#f0e4bf] border-t-[#B8860B]" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Loading your dashboard…</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setEmailVerified(user.emailVerified);

      try {
        const profileSnapshot = await getDoc(doc(db, "users", user.uid));

        if (!profileSnapshot.exists()) {
          setError("Your student profile could not be found. Please contact MathsNMe support.");
          return;
        }

        setProfile(profileSnapshot.data() as StudentProfile);
      } catch (caughtError) {
        console.error(caughtError);
        setError("We could not load your dashboard. Please refresh and try again.");
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

  async function resendVerification() {
    if (!auth.currentUser) return;

    setVerificationMessage("");

    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationMessage("Verification email sent. Please check your inbox.");
    } catch (caughtError) {
      if (
        caughtError instanceof FirebaseError &&
        caughtError.code === "auth/too-many-requests"
      ) {
        setVerificationMessage("Please wait before requesting another email.");
      } else {
        setVerificationMessage("Unable to send the email right now. Please try again later.");
      }
    }
  }

  async function refreshVerificationStatus() {
    if (!auth.currentUser) return;

    setVerificationMessage("");
    try {
      await auth.currentUser.reload();
      setEmailVerified(auth.currentUser.emailVerified);
      setVerificationMessage(
        auth.currentUser.emailVerified
          ? "Email verified. Your account is up to date."
          : "Your email is not verified yet. Open the latest verification email, then try again.",
      );
    } catch {
      setVerificationMessage("Unable to refresh verification status. Please try again.");
    }
  }

  if (isLoading) return <DashboardLoader />;

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffcf5] px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <CircleAlert className="mx-auto text-red-500" size={40} />
          <h1 className="mt-4 text-xl font-black text-slate-900">Dashboard unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  const firstName = profile.studentName.split(" ")[0];
  const needsPretest = !profile.pretestCompleted;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF8EA] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#F7D65D]/10 blur-[140px]" />
        <div className="absolute right-0 top-52 h-[450px] w-[450px] rounded-full bg-[#FFECA8]/35 blur-[110px]" />
        <div className="absolute left-0 top-[650px] h-[350px] w-[350px] rounded-full bg-[#FFF3C5]/30 blur-[120px]" />
      </div>
      <header className="sticky top-0 z-40 border-b border-[#e8dfc8] bg-white/95 backdrop-blur-xl">
        <div className="flex min-h-[72px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-xl border border-[#e8dfc8] p-2.5 text-slate-600 transition hover:border-[#D4AF37] hover:bg-[#fff8e4] hover:text-slate-950"
              aria-label="Toggle dashboard menu"
              aria-expanded={menuOpen}
            >
              <Menu size={22} />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="MathsNMe" width={42} height={42} priority className="rounded-xl" />
              <span className="hidden text-2xl font-black tracking-[-0.04em] sm:inline">MathsNMe</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-[#eadfb9] bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm" title="Daily learning streak">
              <Zap size={16} className="text-[#D4AF37]" fill="currentColor" />
              <span className="hidden sm:inline">0 day</span>
              <span>streak</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#eadfb9] bg-[#fff9e8] px-3 py-2 text-sm font-black text-[#8a6500]" title="Experience points">
              <Zap size={16} fill="currentColor" />
              <span>0 XP</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-[#eadfb9] bg-white px-3 py-2 text-sm font-black text-slate-700" title="MathsNMe coins">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[9px] font-black text-white">M</span>
              <span>0</span>
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
                  className="absolute right-0 top-[calc(100%+12px)] w-60 overflow-hidden rounded-2xl border border-[#e8dfc8] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
                >
                  <div className="border-b border-[#eee7d5] px-3 py-3">
                    <p className="truncate text-sm font-black text-slate-950">
                      {profile.studentName}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {profile.guardianEmail}
                    </p>
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
          aria-label="Close dashboard menu"
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
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl border border-[#e8dfc8] p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
              aria-label="Close dashboard menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1.5" aria-label="Student dashboard">
            {navigation.map(({ label, icon: Icon, href, active, locked }) =>
              locked ? (
                <button
                  key={label}
                  type="button"
                  disabled
                  title="Unlocks after 1 year of active learning"
                  className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-400"
                >
                  <Icon size={19} />
                  <span className="flex-1">{label}</span>
                  <LockKeyhole size={15} />
                </button>
              ) : (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? "bg-[#fff4cc] text-[#8a6500]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
                >
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

      <div className="relative mx-auto max-w-[1600px]">
        <main className="min-w-0 px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
          {!emailVerified && (
            <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-[#edd787] bg-[#fff8df] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <MailCheck className="mt-0.5 shrink-0 text-[#9a7200]" size={21} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Verify your guardian email</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-600">Verification keeps the account secure and enables account recovery.</p>
                  {verificationMessage && <p className="mt-1 text-xs font-semibold text-[#8a6500]">{verificationMessage}</p>}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={resendVerification} className="rounded-xl border border-[#d9be60] bg-white px-4 py-2 text-xs font-bold text-[#8a6500] transition hover:bg-[#fffdf7]">
                  Resend email
                </button>
                <button type="button" onClick={refreshVerificationStatus} className="rounded-xl px-2 py-2 text-xs font-bold text-[#8a6500] underline underline-offset-2 transition hover:text-[#725400]">
                  Refresh status
                </button>
              </div>
            </div>
          )}

          <section>
            <div>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Welcome back, {firstName}!
              </h1>
              <p className="mt-2 text-slate-600">Ready to make progress in Maths today?</p>
            </div>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-3" aria-label="Mathematics programs">
            <Link
              href="/topics/vedic-maths"
              className="group flex items-center gap-4 rounded-3xl border border-[#e8d8a8] bg-white/95 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff1b8] text-[#b37d00]">
                <Calculator size={27} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black text-slate-950">Vedic Mathematics</span>
                <span className="mt-1 block text-sm text-slate-500">Speed and calculation skills</span>
              </span>
              <ArrowRight size={20} className="shrink-0 text-[#B8860B] transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/topics/ib-mathematics"
              className="group flex items-center gap-4 rounded-3xl border border-blue-100 bg-white/95 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Brain size={27} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black text-slate-950">IB Mathematics</span>
                <span className="mt-1 block text-sm text-slate-500">Conceptual problem solving</span>
              </span>
              <ArrowRight size={20} className="shrink-0 text-blue-600 transition group-hover:translate-x-1" />
            </Link>

            <div
              className="flex cursor-not-allowed items-center gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5 opacity-75 shadow-[0_12px_35px_rgba(15,23,42,0.04)]"
              title="Unlocks after 1 year of active learning"
              aria-label="Olympiad is locked and unlocks after 1 year of active learning"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Trophy size={27} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-lg font-black text-slate-600">
                  Olympiad
                  <LockKeyhole size={16} />
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-400">Unlocks after 1 year</span>
              </span>
            </div>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Learning statistics">
            {[
              { label: "Current level", value: profile.currentLevel || "Not set", icon: Trophy, color: "bg-[#fff2c2] text-[#b37d00]" },
              { label: "Weekly practice", value: "0 / 60 min", icon: Clock3, color: "bg-blue-100 text-blue-600" },
              { label: "Worksheets done", value: "0", icon: FileText, color: "bg-green-100 text-green-600" },
              { label: "Average accuracy", value: "—", icon: BarChart3, color: "bg-purple-100 text-purple-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <article key={label} className="rounded-2xl border border-[#e8dfc8] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div>
                <p className="mt-5 text-2xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a2415] to-[#111827] p-7 text-white shadow-xl sm:p-8">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-2xl" />
              <div className="relative max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#f8dc7b]">
                  <Sparkles size={14} />
                  {needsPretest ? "YOUR FIRST STEP" : "CONTINUE LEARNING"}
                </div>
                <h2 className="mt-5 text-2xl font-black sm:text-3xl">
                  {needsPretest ? "Find the level that is right for you" : "Continue from your current level"}
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
                  {needsPretest
                    ? "Take a short pre-test so MathsNMe can recommend the best starting point for your learning journey."
                    : "Keep building confidence through your personalised worksheets and practice plan."}
                </p>
                <Link href={needsPretest ? "/topics" : "/topics"} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#e0bd4a]">
                  {needsPretest ? "Choose a pre-test" : "Continue learning"}
                  <ArrowRight size={17} />
                </Link>
              </div>
            </article>

            <article id="progress" className="rounded-3xl border border-[#e8dfc8] bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">Weekly goal</p>
                  <h2 className="mt-1 text-xl font-black">60 minutes</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4cc] text-[#9a7200]"><Clock3 size={21} /></div>
              </div>
              <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-0 rounded-full bg-[#D4AF37]" />
              </div>
              <div className="mt-3 flex justify-between text-xs font-semibold text-slate-500">
                <span>0 minutes completed</span>
                <span>0%</span>
              </div>
              <p className="mt-6 rounded-2xl bg-[#faf8f2] p-4 text-xs leading-5 text-slate-600">
                Complete practice across 2–3 sessions each week to build a consistent learning habit.
              </p>
            </article>
          </section>

        </main>
      </div>
    </div>
  );
}
