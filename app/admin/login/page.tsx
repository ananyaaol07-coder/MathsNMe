"use client";

import { FirebaseError } from "firebase/app";
import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";

export default function AdminLogin() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim();
    if (!email) { setError("Admin sign-in is not configured yet. Complete the admin account setup first."); return; }
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setBusy(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      try {
        const role = await getDocFromServer(doc(db, "admins", user.uid));
        if (role.data()?.active !== true) throw new Error("Admin access is not enabled for this account.");
      } catch {
        await signOut(auth);
        setError("Admin access could not be verified. Check your connection and account permissions.");
        return;
      }
      router.replace("/admin");
    } catch (caught) {
      setError(caught instanceof FirebaseError && caught.code === "auth/too-many-requests"
        ? "Too many attempts. Please wait before trying again."
        : caught instanceof FirebaseError && caught.code === "auth/network-request-failed"
          ? "Check your internet connection and try again."
          : "Unable to sign in. Check your password and try again.");
    } finally { setBusy(false); }
  }
  return <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-white to-[#fff4d7] px-6 py-16">
    <section className="w-full max-w-md rounded-[2rem] border border-[#eadfb9] bg-white p-8 shadow-xl sm:p-10">
      <Link href="/" className="text-xl font-black text-slate-950">MathsNMe<span className="text-[#a47a10]">.</span></Link>
      <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2c2] text-[#9a7200]"><ShieldCheck /></div>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#9a7200]">Administration</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Welcome back, Admin</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Your space to review students and follow their learning journey.</p>
      <form onSubmit={login} className="mt-8 space-y-5">
        <label className="block text-sm font-semibold text-slate-700">Username<input name="username" autoComplete="username" value="Admin" readOnly className="mt-2 w-full rounded-xl border border-[#e5dcc5] bg-[#fffcf5] px-4 py-3 text-slate-500" /></label>
        <label className="block text-sm font-semibold text-slate-700">Password<div className="relative mt-2"><input name="password" type={visible ? "text" : "password"} autoComplete="current-password" required className="w-full rounded-xl border border-[#e5dcc5] px-4 py-3 pr-12 outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#D4AF37]/20" /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)} className="absolute right-3 top-3 text-slate-500">{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3.5 font-bold text-slate-950 transition hover:bg-[#c79d18] disabled:opacity-50">{busy ? "Signing in…" : "Open admin dashboard"}<ArrowRight size={18} /></button>
      </form>
      <Link href="/login" className="mt-6 block text-center text-sm text-slate-500 hover:underline">Student login</Link>
    </section>
  </div>;
}
