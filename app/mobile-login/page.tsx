"use client";

import { signInWithCustomToken } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export default function MobileLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const requestedTarget = params.get("target") || "/dashboard";
    const target = requestedTarget.startsWith("/") && !requestedTarget.startsWith("//") ? requestedTarget : "/dashboard";
    if (!token) { setError("The app session was not available. Please return to the app and sign in again."); return; }
    fetch("/api/mobile-auth", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (!response.ok) throw new Error("Session exchange failed");
        return response.json() as Promise<{ customToken: string }>;
      })
      .then(({ customToken }) => signInWithCustomToken(auth, customToken))
      .then(() => router.replace(target))
      .catch(() => setError("Unable to connect the app to the local website. Please try again."));
  }, [params, router]);

  return <main className="flex min-h-screen items-center justify-center bg-[#FFFDF8] p-6"><section className="max-w-md rounded-3xl border border-[#eadfb9] bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-slate-950">{error ? "Connection unavailable" : "Opening your learning page…"}</h1><p className="mt-4 text-sm leading-6 text-slate-600">{error || "Signing you in securely with your MathsNMe app session."}</p></section></main>;
}
