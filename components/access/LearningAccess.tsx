"use client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
export default function LearningAccess({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let stopProfile = () => {}, version = 0;
    const stopAuth = onAuthStateChanged(auth, user => {
      const current = ++version;
      stopProfile(); setStatus("loading");
      if (!user) { setStatus("signin"); return; }
      stopProfile = onSnapshot(doc(db, "users", user.uid), { includeMetadataChanges: true }, async snapshot => {
        if (snapshot.metadata.fromCache) return;
        if (!snapshot.exists()) { setStatus("blocked"); return; }
        // Existing profiles keep access. Clients cannot create new profiles or set enrollmentId.
        if (!snapshot.data().enrollmentId) { setStatus("allowed"); return; }
        try {
          const token = await user.getIdToken();
          const response = await fetch("/api/enrollment/access", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
          if (version === current) setStatus(response.ok ? "allowed" : "blocked");
        } catch { if (version === current) setStatus("error"); }
      }, () => setStatus("error"));
    });
    return () => { version++; stopAuth(); stopProfile(); };
  }, []);
  if (status === "allowed") return children;
  return <div className="flex min-h-[70vh] items-center justify-center bg-[#FFFDF8] p-6"><div className="max-w-lg rounded-3xl border border-[#eadfb9] bg-white p-8 text-center text-slate-900"><h1 className="text-2xl font-bold">{status === "loading" ? "Checking learning access…" : status === "signin" ? "Log in to continue" : status === "error" ? "Unable to check access" : "Complete your enrollment first"}</h1><p className="mt-4 text-sm leading-6 text-slate-600">{status === "loading" ? "Please wait a moment." : "New learners attend a parent webinar and complete payment before activating their account. Existing students can log in as usual."}</p>{status !== "loading" && <div className="mt-6 flex justify-center gap-5"><Link href="/login" className="font-bold text-[#9a7200] underline">Log in</Link><Link href="/signup" className="font-bold text-[#9a7200] underline">Register</Link>{status === "error" && <button onClick={() => window.location.reload()} className="underline">Retry</button>}</div>}</div></div>;
}
