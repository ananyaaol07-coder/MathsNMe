"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Status = { fee: { label: string }; paid: boolean; activated: boolean; credentialsSent: boolean };
export default function EnrollmentPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true); setError("");
    try {
      const token = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      const response = await fetch("/api/enrollment/status", { headers: { "x-enrollment-token": token }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStatus(result);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to check payment status."); }
    finally { setBusy(false); }
  }
  useEffect(() => { const timer = setTimeout(() => { void refresh(); }, 0); return () => clearTimeout(timer); }, []);
  return <div className="min-h-[80vh] bg-[#FFFDF8] px-5 py-14 text-slate-900"><section className="mx-auto max-w-xl rounded-3xl border border-[#eadfb9] bg-white p-8 shadow-lg">
    <Link href="/" className="text-xl font-black text-[#9a7200]">MathsNMe</Link>
    <h1 className="mt-5 text-3xl font-bold">Your enrollment status</h1>
    {status && <div className="mt-6 space-y-4 leading-7">{status.credentialsSent ? <><p>Your payment has been confirmed. Your child’s login email and generated password have been emailed to the parent’s registered email address.</p><Link href="/login" className="font-bold text-[#9a7200] underline">Log in to the learning account</Link></> : status.paid ? <p>Your payment has been verified by admin. Your child’s account and credential email are being completed. Contact MathsNMe if the email has not arrived.</p> : <><p>Your enrollment fee is <strong>{status.fee.label}</strong>. Admin will send the payment QR image directly to the parent’s WhatsApp number.</p><p>After paying, send the transaction reference or receipt to admin on WhatsApp. Admin will verify the payment, then your child’s login details will be emailed to the parent.</p><p>Please wait for verification before making another payment.</p></>}</div>}
    {error && <p role="alert" className="mt-5 text-red-700">{error}</p>}
    <button onClick={refresh} disabled={busy} className="mt-6 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold disabled:opacity-50">{busy ? "Checking…" : "Refresh payment status"}</button>
    <p className="mt-6 text-sm text-slate-500">Need help? Contact rameshaol@gmail.com.</p>
  </section></div>;
}
