"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";

export default function AdminAccess({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<"loading" | "allowed" | "denied" | "error">("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let stopRole = () => {};
    const stopAuth = onAuthStateChanged(auth, user => {
      stopRole();
      setAccess("loading");
      if (!user) { setAccess("denied"); return; }
      stopRole = onSnapshot(doc(db, "admins", user.uid), { includeMetadataChanges: true }, snapshot => {
        // Do not grant access using a cached role while offline.
        if (snapshot.metadata.fromCache) return;
        setAccess(snapshot.data()?.active === true ? "allowed" : "denied");
      }, () => setAccess("error"));
    });
    return () => { stopAuth(); stopRole(); };
  }, []);

  if (access === "allowed") return children;
  return <div className="flex min-h-[75vh] items-center justify-center bg-[#fffcf5] px-6">
    <section className="w-full max-w-md rounded-3xl border border-[#eadfb9] bg-white p-8 text-center shadow-lg">
      <p className="text-xs font-bold uppercase tracking-widest text-[#9a7200]">MathsNMe · Admin</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900">{access === "loading" ? "Checking access…" : access === "error" ? "Unable to verify access" : "Admin sign-in required"}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{access === "loading" ? "Please wait while we verify your admin account. An internet connection is required." : access === "error" ? "Check your connection and admin setup, then try again." : "Sign in with the authorised admin account to view student records."}</p>
      {access !== "loading" && <Link href="/admin/login" className="mt-6 inline-block rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-slate-950">Go to admin login</Link>}
      {access === "error" && <button onClick={() => window.location.reload()} className="ml-4 mt-4 text-sm font-semibold underline">Retry</button>}
      {access !== "loading" && auth.currentUser && <button onClick={async () => { try { await signOut(auth); } catch { setMessage("Unable to sign out. Please try again."); } }} className="mt-5 block w-full text-sm text-slate-600 underline">Sign out of current account</button>}
      {message && <p role="alert" className="mt-3 text-sm text-red-700">{message}</p>}
    </section>
  </div>;
}
