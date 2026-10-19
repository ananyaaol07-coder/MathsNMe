"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { countries } from "@/lib/countries";
import { auth, db } from "@/lib/firebase";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

const benefits = [
  {
    icon: FileText,
    title: "Structured practice",
    description: "Level-based worksheets designed to build strong foundations.",
  },
  {
    icon: Brain,
    title: "Smart evaluation",
    description: "Personalised feedback that helps students learn from mistakes.",
  },
  {
    icon: BarChart3,
    title: "Visible progress",
    description: "Track consistency, accuracy, and improvement over time.",
  },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#e5dcc5] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10";

function getSignupError(code: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Please choose a stronger password.";
    case "auth/network-request-failed":
      return "Please check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "Email registration has not been enabled in Firebase yet.";
    case "permission-denied":
      return "Your account was created, but the student profile could not be saved. Please check the Firestore rules.";
    default:
      return "Unable to create your account. Please try again.";
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const studentName = String(form.get("studentName") ?? "").trim();
    const grade = Number(form.get("grade"));
    const board = String(form.get("board") ?? "").trim();
    const country = String(form.get("country") ?? "").trim();
    const state = String(form.get("state") ?? "").trim();
    const city = String(form.get("city") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const phone = String(form.get("phone") ?? "").trim();
    const countryCode = String(form.get("countryCode") ?? "");
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    const acceptedTerms = form.get("terms") === "on";
    const selectedCountry = countries.find(
      (country) => country.code === countryCode,
    );
    const phoneDigits = phone.replace(/\D/g, "");

    if (
      !studentName ||
      !grade ||
      !board ||
      !country ||
      !state ||
      !city ||
      !email ||
      !selectedCountry ||
      !phoneDigits
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the MathsNMe Learning Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      try {
        await setDoc(doc(db, "users", credential.user.uid), {
          studentName,
          grade,
          board,
          country,
          state,
          city,
          guardianEmail: email,
          phone: `${selectedCountry.dialCode.replace(/\s/g, "")}${phoneDigits}`,
          countryCode: selectedCountry.code,
          dialCode: selectedCountry.dialCode,
          role: "student",
          currentLevel: 0,
          pretestCompleted: false,
          policyAccepted: true,
          policyAcceptedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (profileError) {
        // Avoid leaving an unusable Authentication account when its profile
        // cannot be created in Firestore.
        await deleteUser(credential.user);
        throw profileError;
      }

      try {
        await sendEmailVerification(credential.user);
      } catch (verificationError) {
        // The account and profile are valid even if email delivery is
        // temporarily unavailable. Verification can be resent later.
        console.error("Unable to send verification email", verificationError);
      }

      router.push("/dashboard");
    } catch (caughtError) {
      if (caughtError instanceof FirebaseError) {
        setError(getSignupError(caughtError.code));
      } else {
        setError("Unable to create your account. Please try again.");
      }
      console.error(caughtError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-[#fffdf7] to-[#fff4d7]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#F7D65D]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-56 h-96 w-96 rounded-full bg-[#FFECA8]/60 blur-[100px]" />

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

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-16">
        <section className="hidden max-w-lg lg:block" aria-labelledby="signup-benefits-heading">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ead087] bg-white/80 px-4 py-2 text-sm font-bold text-[#9a7200] shadow-sm">
            <Sparkles size={16} />
            Start your learning journey
          </div>

          <h1
            id="signup-benefits-heading"
            className="mt-7 text-5xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950"
          >
            Build maths confidence,
            <span className="text-[#B8860B]"> one level at a time.</span>
          </h1>

          <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
            Create a student account to begin with a pre-test and follow a learning path matched to your current level.
          </p>

          <div className="mt-9 space-y-5">
            {benefits.map(({ icon: Icon, title, description }) => (
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

          <div className="mt-9 flex items-center gap-3 text-sm font-semibold text-slate-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f8ec] text-green-600">
              <LockKeyhole size={17} />
            </div>
            Your information is kept private and secure.
          </div>
        </section>

        <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-[#eadfb9] bg-white/95 p-6 shadow-[0_28px_80px_rgba(102,78,18,0.14)] backdrop-blur sm:p-9">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#B8860B]">
              Student registration
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Already learning with us?{" "}
              <Link href="/login" className="font-bold text-[#9a7200] hover:text-[#725400]">
                Log in
              </Link>
            </p>
          </div>

          <form className="mt-8" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Student name
                <input
                  type="text"
                  name="studentName"
                  autoComplete="name"
                  placeholder="Enter full name"
                  className={inputClass}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Grade
                <select name="grade" defaultValue="" className={inputClass} required>
                  <option value="" disabled>
                    Select grade
                  </option>
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Grade {index + 1}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Board
                <select name="board" defaultValue="" className={inputClass} required>
                  <option value="" disabled>
                    Select board
                  </option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="IB">IB</option>
                  <option value="IGCSE">IGCSE</option>
                  <option value="State Board">State Board</option>
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Country
                <select name="country" defaultValue="India" className={inputClass} required>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                State
                <input
                  type="text"
                  name="state"
                  autoComplete="address-level1"
                  placeholder="Enter state or province"
                  className={inputClass}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                City
                <input
                  type="text"
                  name="city"
                  autoComplete="address-level2"
                  placeholder="Enter city"
                  className={inputClass}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Email
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="abc@example.com"
                  className={inputClass}
                  required
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Phone number
                <div className="mt-2 flex overflow-hidden rounded-xl border border-[#e5dcc5] bg-white transition focus-within:border-[#D4AF37] focus-within:ring-4 focus-within:ring-[#D4AF37]/10">
                  <select
                    name="countryCode"
                    defaultValue="IN"
                    aria-label="Country calling code"
                    className="max-w-[9.5rem] border-r border-[#e5dcc5] bg-[#fffcf3] px-3 text-sm font-semibold text-slate-700 outline-none sm:max-w-[12rem]"
                  >
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.dialCode})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="numeric"
                    placeholder="Enter phone number"
                    className="min-w-0 flex-1 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Password
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    minLength={8}
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

              <label className="text-sm font-semibold text-slate-700">
                Confirm password
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Enter again"
                    minLength={8}
                    className={`${inputClass} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-[#fff8e4] hover:text-slate-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-slate-600">
              <input
                type="checkbox"
                name="terms"
                className="peer sr-only"
                required
              />
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#d7cba9] bg-white text-white peer-checked:border-[#B8860B] peer-checked:bg-[#B8860B]">
                <Check size={14} strokeWidth={3} />
              </span>
              <span>
                I agree to the MathsNMe learning policy and consent to the use of this information for managing the student account.
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3.5 font-bold text-slate-950 shadow-[0_14px_30px_rgba(212,175,55,0.25)] transition hover:-translate-y-0.5 hover:bg-[#c79d18] hover:shadow-[0_18px_38px_rgba(212,175,55,0.32)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Creating account..." : "Create student account"}
              {!isSubmitting && (
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              )}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              Registration is free. A parent or guardian should create the account for students under 18.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
