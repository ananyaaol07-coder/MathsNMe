"use client";
import { useCallback, useEffect, useState } from "react";
import { ibApi } from "@/lib/ib/client";
type RequestStatus = "pending" | "approved" | "rejected";
type RequestItem = { id: string; studentName: string; registeredGrade: number; grade: number; requestedAt: number; status: RequestStatus; reviewedAt?: number };
export default function IBAccessRequests() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState("");
  const load = useCallback(async () => {
    try { const data = await ibApi("/api/admin/ib-access"); setRequests(data.requests); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load requests."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const initial = setTimeout(() => { void load(); }, 0); const timer = setInterval(() => { void load(); }, 30000); return () => { clearTimeout(initial); clearInterval(timer); }; }, [load]);
  async function decide(item: RequestItem, decision: string) {
    setSaving(item.id); setNotice("");
    try { await ibApi("/api/admin/ib-access", { id: item.id, decision }, "PATCH"); setNotice(`Grade ${item.grade} request for ${item.studentName}: ${decision}.`); await load(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update request."); }
    finally { setSaving(""); }
  }
  return <section className="rounded-3xl border border-[#eadfb9] bg-white p-6"><h2 className="text-2xl font-bold">IB grade access requests</h2><p className="mt-2 text-sm text-slate-500">Review all grade requests and change an earlier decision whenever needed. The newest 200 requests are shown.</p>{notice && <p role="status" className="mt-4 text-green-700">{notice}</p>}{error && <p role="alert" className="mt-4 text-red-700">{error} <button onClick={load} className="underline">Retry</button></p>}{loading ? <p className="mt-6">Loading requests…</p> : requests.length ? <div className="mt-6 space-y-4">{requests.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eadfb9] p-5"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.studentName}</h3><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${item.status === "approved" ? "bg-green-50 text-green-700" : item.status === "rejected" ? "bg-red-50 text-red-700" : "bg-[#fff4cc] text-[#8a6500]"}`}>{item.status}</span></div><p className="mt-1 text-sm text-slate-600">Registered: Grade {item.registeredGrade} · Requested: Grade {item.grade}</p></div><div className="flex gap-3"><button disabled={!!saving || item.status === "approved"} onClick={() => decide(item, "approved")} className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold disabled:opacity-50">Approve</button><button disabled={!!saving || item.status === "rejected"} onClick={() => decide(item, "rejected")} className="rounded-xl border border-slate-200 px-4 py-2 font-bold disabled:opacity-50">Decline</button></div></article>)}</div> : !error && <p className="mt-6 text-sm text-slate-500">No grade requests yet.</p>}</section>;
}
