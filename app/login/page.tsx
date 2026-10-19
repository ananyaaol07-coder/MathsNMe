"use client";

import { FirebaseError } from "firebase/app";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/firebase";

const features = [
  {
    icon: BookOpenCheck,
    title: "Continue where you stopped",
    description: "Return to your current level and active worksheets.",
  },
  {
    icon: BarChart3,
    title: "See your improvement",
    description: "Review practice time, accuracy, and learning progress.",
  },
  {
    icon: ShieldCheck,
    title: "A secure learning space",
    description: "Your student account and learning records stay protected.",
  },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#e5dcc5] bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10";

function getLoginError(code: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password is incorrect.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact MathsNMe support.";
    case "auth/too-many-requests":
      return "Too many unsuccessful attempts. Please wait and try again.";
    case "auth/network-request-failed":
      return "Please check your internet connection and try again.";
    default:
      return "Unable to log in. Please try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const loginEmail = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
      router.replace("/dashboard");
    } catch (caughtError) {
      if (caughtError instanceof FirebaseError) {
        setError(getLoginError(caughtError.code));
      } else {
        setError("Unable to log in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    const resetEmail = email.trim().toLowerCase();
    setError("");
    setMessage("");

    if (!resetEmail) {
      setError("Enter your email address first, then select Forgot password.");
      return;
    }

    setIsResetting(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMessage("Password reset email sent. Please check your inbox and spam folder.");
    } catch (caughtError) {
      if (caughtError instanceof FirebaseError && caughtError.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (
        caughtError instanceof FirebaseError &&
        caughtError.code === "auth/too-many-requests"
      ) {
        setError("Please wait before requesting another reset email.");
      } else {
        // Avoid revealing whether an account exists for a particular email.
        setMessage("If an account uses this email, a reset link will arrive shortly.");
      }
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-[#fffdf7] to-[#fff4d7]">
      <div className="pointer-events-none absolute left-1/3 top-0 h-[650px] w-[650px] rounded-full bg-[#F7D65D]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-52 h-96 w-96 rounded-full bg-[#FFECA8]/60 blur-[100px]" />

      <header className="relative border-b border-[#eadfb9]/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="MathsNMe home">
            <Image
              src="/logo.png"
              alt="MathsNMe logo"
              width={44}
              height={44}
              priority
              className="rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
            />
            <span className="text-2xl font-black tracking-[-0.03em] text-slate-900">
              MathsNMe
            </span>
          </Link>

          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            >
              <ArrowLeft size={17} />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid min-h-[calc(100vh-77px)] max-w-7xl gap-14 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-16">
        <section className="hidden max-w-lg lg:block" aria-labelledby="login-benefits-heading">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ead087] bg-white/80 px-4 py-2 text-sm font-bold text-[#9a7200] shadow-sm">
            <Sparkles size={16} />
            Welcome back
          </div>

          <h1
            id="login-benefits-heading"
            className="mt-7 text-5xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950"
          >
            Small steps today.
            <span className="text-[#B8860B]"> Stronger maths tomorrow.</span>
          </h1>

          <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
            Log in to continue your personalised MathsNMe learning journey.
          </p>

          <div className="mt-9 space-y-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#B8860B] shadow-md ring-1 ring-[#eadfb9]">
                  <Icon size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-xl rounded-[2rem] border border-[#eadfb9] bg-white/95 p-6 shadow-[0_28px_80px_rgba(102,78,18,0.14)] backdrop-blur sm:p-9 lg:p-10">
          <Link
            href="/admin/login"
            className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full border border-[#e5d391] bg-white px-3 py-2 text-xs font-bold text-[#9a7200] transition hover:border-[#D4AF37] hover:bg-[#fff8e4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B8860B] sm:right-9 sm:top-9"
          >
            <ShieldCheck size={15} aria-hidden="true" />
            Admin login
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2c2] text-[#9a7200]">
            <LockKeyhole size={23} />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-[#B8860B]">
            Student login
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
            Continue learning
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            New to MathsNMe?{" "}
            <Link href="/signup" className="font-bold text-[#9a7200] hover:text-[#725400]">
              Create an account
            </Link>
          </p>

          <form className="mt-8" onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="abc@example.com"
                  className={`${inputClass} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Password
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`${inputClass} pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-[#fff8e4] hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResetting}
                className="text-sm font-bold text-[#9a7200] transition hover:text-[#725400] disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isResetting ? "Sending reset email…" : "Forgot password?"}
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3.5 font-bold text-slate-950 shadow-[0_14px_30px_rgba(212,175,55,0.25)] transition hover:-translate-y-0.5 hover:bg-[#c79d18] hover:shadow-[0_18px_38px_rgba(212,175,55,0.32)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Logging in…" : "Log in to MathsNMe"}
              {!isSubmitting && <ArrowRight size={18} className="transition group-hover:translate-x-1" />}
            </button>
          </form>

        </section>
      </main>
    </div>
  );
}
