"use client";
import { useCallback, useEffect, useState } from "react";
import { profileApi } from "@/lib/profile-client";
import { type ContactRequest } from "@/lib/profile";
import { dateLabel } from "@/lib/admin/students";
export default function ContactRequests() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRequests((await profileApi("/api/admin/contact-requests")).requests); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load requests."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  return <section className="mt-8 rounded-3xl border border-[#eadfb9] bg-white p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Contact change requests</h2><button onClick={load} disabled={loading} className="text-sm font-bold text-[#8a6500] underline disabled:opacity-50">Refresh</button></div><p className="mt-3 text-sm leading-6 text-slate-500">Follow up with the parent or guardian to verify each change. Requests do not automatically update the student profile or sign-in email.</p>{error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}{loading ? <p role="status" className="mt-5 text-sm text-slate-500">Loading requests…</p> : !error && requests.length === 0 ? <p className="mt-5 text-sm text-slate-500">No pending contact changes.</p> : !error && <div className="mt-6 grid gap-4 lg:grid-cols-2">{requests.map(request => <article key={request.id} className="rounded-2xl border border-[#eadfb9] p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{request.studentName}</h3><span className="rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-bold text-[#8a6500]">Awaiting review</span></div><p className="mt-2 text-xs text-slate-500">{request.field === "email" ? "Email change" : "Phone change"} · {dateLabel(request.requestedAt)}</p><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Current</dt><dd className="mt-1 break-words">{request.currentValue || "Not recorded"}</dd></div><div><dt className="text-slate-500">Requested</dt><dd className="mt-1 break-words font-semibold">{request.requestedValue}</dd></div>{request.reason && <div><dt className="text-slate-500">Reason</dt><dd className="mt-1 whitespace-pre-wrap break-words">{request.reason}</dd></div>}</dl></article>)}</div>}</section>;
}
