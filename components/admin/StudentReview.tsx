"use client";

import { doc, getDocFromServer, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { type AdminStudent, dateLabel, levelLabel, timestampMillis } from "@/lib/admin/students";

export default function StudentReview({ student, onClose }: { student: AdminStudent; onClose: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const [notes, setNotes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    let active = true;
    getDocFromServer(doc(db, "adminReviews", student.id)).then(snapshot => {
      if (!active) return;
      const data = snapshot.data();
      setNotes(typeof data?.notes === "string" ? data.notes : "");
      setReviewed(data?.reviewed === true);
      setSavedAt(timestampMillis(data?.updatedAt));
    }).catch(() => { if (active) { setLoadError(true); setMessage("Unable to load the existing review. Close and reopen this student to retry."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [student.id]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!auth.currentUser || loading || loadError) return;
    setSaving(true); setMessage("");
    try {
      await setDoc(doc(db, "adminReviews", student.id), { notes: notes.trim(), reviewed, reviewedBy: auth.currentUser.uid, updatedAt: serverTimestamp() });
      setSavedAt(Date.now()); setDirty(false); setMessage("Review saved.");
    } catch { setMessage("Review could not be saved. Your notes are still here; please try again."); }
    finally { setSaving(false); }
  }
  const details = [
    ["Email", student.guardianEmail], ["Phone", student.phone], ["Grade", student.grade === null ? "" : String(student.grade)],
    ["Board", student.board], ["Country", student.country], ["State", student.state], ["City", student.city],
    ["Registered", dateLabel(student.createdAt)], ["Learning policy", student.policyAccepted ? "Accepted" : "Not recorded"],
  ];
  return <section aria-labelledby="review-heading" className="rounded-3xl border border-[#eadfb9] bg-white p-6 shadow-sm sm:p-8">
    <button disabled={saving} onClick={() => { if (!dirty || window.confirm("Discard unsaved review changes?")) onClose(); }} className="text-sm font-bold text-[#8a6500] hover:underline disabled:opacity-50">← Back to students</button>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#9a7200]">Student review</p><h2 id="review-heading" tabIndex={-1} ref={headingRef} className="mt-2 text-3xl font-black tracking-tight text-slate-950 outline-none">{student.studentName}</h2></div><span className="rounded-full bg-[#fff4cc] px-4 py-2 text-sm font-bold text-[#8a6500]">{levelLabel(student.currentLevel)}</span></div>
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div><h3 className="font-bold text-slate-900">Registration details</h3><dl className="mt-4 grid gap-5 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-900">{value || "Not recorded"}</dd></div>)}</dl>
        <div className="mt-7 rounded-2xl bg-[#fffcf5] p-5"><h3 className="font-bold text-slate-900">Learning placement</h3><p className="mt-2 text-sm text-slate-600">Pre-test: {student.pretestCompleted ? "Completed" : "Pending"}</p><p className="mt-2 text-sm text-slate-600">Current level: {levelLabel(student.currentLevel)}</p><p className="mt-4 text-xs leading-5 text-slate-500">This is the current placement stored on the student profile. Worksheet results, scores and practice history are not available yet.</p></div>
      </div>
      <form onSubmit={save} className="rounded-2xl border border-slate-200 p-5 sm:p-6"><h3 className="font-bold text-slate-900">Admin review</h3><p className="mt-2 text-sm text-slate-500">Private notes, visible only to authorised admins.</p>
        {loading ? <p role="status" className="mt-5 text-sm">Loading review…</p> : <><label className="mt-5 block text-sm font-semibold text-slate-700">Review notes<textarea value={notes} onChange={event => { setNotes(event.target.value); setDirty(true); setMessage(""); }} maxLength={5000} rows={7} disabled={loadError || saving} placeholder="Observations, support needed, or points to follow up…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#D4AF37]/20" /></label><p className="mt-1 text-right text-xs text-slate-400">{notes.length} / 5,000</p><label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={reviewed} disabled={loadError || saving} onChange={event => { setReviewed(event.target.checked); setDirty(true); setMessage(""); }} className="h-4 w-4 accent-[#B8860B]" />Mark this student as reviewed</label><button disabled={loadError || saving || !dirty} className="mt-5 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{saving ? "Saving…" : "Save review"}</button></>}
        {message && <p role="status" className="mt-4 text-sm text-slate-700">{message}</p>}{savedAt !== null && <p className="mt-4 text-xs text-slate-500">Last saved: {dateLabel(savedAt)}</p>}
      </form>
    </div>
  </section>;
}
