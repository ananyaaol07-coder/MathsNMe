"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";

const input = "mt-1 w-full rounded-xl border border-[#e5dcc5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B8860B]";

export default function VMResources() {
  const [level, setLevel] = useState("1"), [worksheet, setWorksheet] = useState("L1-01");
  const [notes, setNotes] = useState(""), [notesUrl, setNotesUrl] = useState(""), [videoUrl, setVideoUrl] = useState("");
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function request(method: "GET" | "PUT") {
    const token = await auth.currentUser?.getIdToken(); if (!token) throw new Error("Sign in again to manage resources.");
    const path = `${level}/${worksheet}`;
    const response = await fetch(method === "GET" ? `/api/admin/vm-resources?path=${encodeURIComponent(path)}` : "/api/admin/vm-resources", { method, headers: { Authorization: `Bearer ${token}`, ...(method === "PUT" ? { "Content-Type": "application/json" } : {}) }, ...(method === "PUT" ? { body: JSON.stringify({ path, notes, notesUrl, videoUrl }) } : {}) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to manage resources."); return data;
  }
  async function load() { setBusy(true); setMessage(""); try { const data = await request("GET"); setNotes(data.notes); setNotesUrl(data.notesUrl); setVideoUrl(data.videoUrl); setMessage("Resources loaded."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load resources."); } finally { setBusy(false); } }
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); try { await request("PUT"); setMessage("Vedic Mathematics resources saved."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save resources."); } finally { setBusy(false); } }
  return <section className="mt-8 max-w-3xl rounded-3xl border border-[#eadfb9] bg-white p-6"><h2 className="text-xl font-bold">Vedic Mathematics resources</h2><p className="mt-2 text-sm leading-6 text-slate-500">Add notes and a teaching video for each Vedic Mathematics worksheet.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Level<select value={level} onChange={e => setLevel(e.target.value)} className={input}><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></select></label><label className="text-sm font-semibold">Worksheet code<input value={worksheet} onChange={e => setWorksheet(e.target.value)} className={input} placeholder="L1-01" /></label></div><button type="button" disabled={busy} onClick={() => void load()} className="mt-4 rounded-xl border border-[#e5d391] px-4 py-2 text-sm font-bold text-[#8a6500] disabled:opacity-50">Load worksheet resources</button><form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Notes explanation<textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={5000} rows={6} className={input} /></label><label className="block text-sm font-semibold">Notes link<input type="url" value={notesUrl} onChange={e => setNotesUrl(e.target.value)} placeholder="https://…" className={input} /></label><label className="block text-sm font-semibold">Teaching video link<input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://…" className={input} /></label><button disabled={busy} className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Saving…" : "Save resources"}</button></form>{message && <p role="status" className="mt-4 text-sm text-slate-600">{message}</p>}</section>;
}
