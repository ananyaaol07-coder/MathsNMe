"use client";
import { useCallback, useEffect, useState } from "react";
import { feeForCountry } from "@/lib/enrollment/fees.js";
import { auth } from "@/lib/firebase";
import { slotLabel, type Registration } from "@/lib/webinar/schedule";
type Booking = Registration & { id: string; startsAt: number; endsAt: number; status: string; checkoutToken?: string; paymentStatus?: string; accountUid?: string; paymentVerifiedBy?: string; paymentReference?: string; qrMessageId?: string; credentialsSentAt?: number; credentialsStatus?: string };
export default function WebinarRegistrations({ paymentsOnly = false }: { paymentsOnly?: boolean }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [now, setNow] = useState(0);
  const [filter, setFilter] = useState("all");
  const load = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sign in again to load webinar registrations.");
      const response = await fetch("/api/admin/webinars", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setBookings(result.registrations); setError("");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to load webinars."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => { void load(); setNow(Date.now()); }, 0);
    const timer = setInterval(() => { void load(); }, 15000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(initial); clearInterval(timer); clearInterval(clock); };
  }, [load]);
  async function markDone(id: string) {
    setSaving(id);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/webinars", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : "Update failed."); }
    finally { setSaving(""); }
  }
  async function paymentAction(booking: Booking) {
    const reference = booking.paymentReference || window.prompt("Verify the payment in your bank account, then enter the transaction reference:");
    if (!reference) return;
    setSaving(booking.id); setError(""); setNotice("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/payments", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: booking.id, action: "approve", reference }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setNotice("Payment confirmed. Credentials emailed to the parent.");
    } catch (error) { setError(error instanceof Error ? error.message : "Payment action failed."); }
    finally { await load(); setSaving(""); }
  }
  const due = bookings.filter(booking => booking.status !== "done" && booking.endsAt <= now);
  const attended = bookings.filter(booking => booking.status === "done").length;
  const pending = Math.max(0, bookings.length - attended);
  const attendanceRate = bookings.length ? `${Math.round(attended / bookings.length * 100)}%` : "—";
  const visible = bookings.filter(booking => !paymentsOnly || booking.status === "done").filter(booking => filter === "all" || (filter === "done" ? booking.status === "done" : filter === "due" ? booking.status !== "done" && booking.endsAt <= now : booking.status !== "done" && booking.endsAt > now)).sort((a, b) => a.startsAt - b.startsAt);
  return <section className="my-8 rounded-3xl border border-[#eadfb9] bg-white p-6">
    <div><h2 className="text-2xl font-bold">{paymentsOnly ? "Enrollment payments" : "Parent webinars"}</h2><p className="mt-2 text-sm text-slate-500">One-to-one Zoom sessions · 60 minutes · IST. Send Zoom links to parents after booking.</p></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-[#eadfb9] bg-[#fffcf5] p-4"><p className="text-sm text-slate-500">Total registrations</p><p className="mt-1 text-3xl font-black">{loading ? "—" : bookings.length}</p></div><div className="rounded-2xl border border-[#eadfb9] bg-[#fffcf5] p-4"><p className="text-sm text-slate-500">Attended / completed</p><p className="mt-1 text-3xl font-black text-green-700">{loading ? "—" : attended}</p></div><div className="rounded-2xl border border-[#eadfb9] bg-[#fffcf5] p-4"><p className="text-sm text-slate-500">Pending attendance</p><p className="mt-1 text-3xl font-black text-[#9a7200]">{loading ? "—" : pending}</p></div><div className="rounded-2xl border border-[#eadfb9] bg-[#fffcf5] p-4"><p className="text-sm text-slate-500">Attendance rate</p><p className="mt-1 text-3xl font-black">{loading ? "—" : attendanceRate}</p></div></div>
    {due.length > 0 && <div role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Reminder: {due.length} session{due.length === 1 ? " has" : "s have"} reached the scheduled end time. Review and mark as done.</div>}
    <label className="mt-5 block text-sm font-semibold">Show sessions<select value={filter} onChange={event => setFilter(event.target.value)} className="ml-3 rounded-lg border border-[#eadfb9] bg-white p-2"><option value="all">All (latest 500)</option><option value="upcoming">Upcoming / in progress</option><option value="due">Needs completion</option><option value="done">Completed</option></select></label>
    {notice && <p role="status" className="mt-4 text-sm text-green-700">{notice}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error} <button onClick={load} className="underline">Retry</button></p>}
    {loading ? <p className="mt-6">Loading webinars…</p> : visible.length === 0 ? <p className="mt-6 text-sm text-slate-500">No sessions to show.</p> : <div className="mt-6 space-y-4">{visible.map(booking => <details key={booking.id} className="rounded-2xl border border-[#eadfb9] p-4" open={booking.status !== "done" && booking.endsAt <= now}>
      <summary className="cursor-pointer font-semibold">{booking.date} · {slotLabel(booking.time)} IST — {booking.parentName} <span className={`ml-2 text-xs ${booking.status === "done" ? "text-green-700" : "text-amber-700"}`}>{booking.status === "done" ? "Completed" : booking.endsAt <= now ? "Mark as done" : "Booked"}</span></summary>
      <div className="mt-5 grid gap-5 text-sm sm:grid-cols-2"><div><h3 className="font-bold">Parent</h3><p className="mt-2 break-words">{booking.parentName}</p><p className="mt-1 break-all">{booking.parentPhone}</p><a href={`mailto:${booking.parentEmail}`} className="mt-1 block break-all text-[#9a7200] underline">{booking.parentEmail}</a></div><div><h3 className="font-bold">Student</h3><p className="mt-2">{booking.studentName} · Grade {booking.grade} · {booking.board}</p><p className="mt-1 break-all">{booking.studentPhone}{booking.samePhone ? " (parent’s phone)" : ""}</p><p className="mt-1 break-all">{booking.studentEmail}{booking.sameEmail ? " (parent’s email)" : ""}</p><p className="mt-1">{booking.state}, {booking.country}</p></div></div>
      {booking.status === "done" && <div className="mt-5 rounded-xl bg-[#FFF8EA] p-4 text-sm">
        <p className="font-semibold">{booking.credentialsSentAt ? "Payment verified · credentials emailed" : booking.credentialsStatus === "failed" ? "Payment verified · account/email needs retry" : booking.paymentVerifiedBy ? "Payment verified · credentials pending" : "Attendance confirmed · awaiting admin payment verification"}</p>
        {!booking.paymentVerifiedBy && !booking.accountUid && <p className="mt-2 text-slate-600">Open the parent’s chat, attach your payment QR image for {feeForCountry(booking.country).label}, and press Send in WhatsApp. Opening the chat does not confirm delivery.</p>}
        <div className="mt-3 flex flex-wrap gap-4">
          {!booking.paymentVerifiedBy && !booking.accountUid && <a href={`https://wa.me/${booking.parentPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${booking.parentName}, thank you for attending the MathsNMe webinar. The enrollment fee for ${booking.studentName} is ${feeForCountry(booking.country).label}. I will share the payment QR image in this chat. After paying, please reply with your receipt or transaction reference. We will verify payment and email your child’s login details to your registered parent email. Booking: ${booking.id}`)}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#9a7200] underline">Open WhatsApp to share QR</a>}
          {!booking.credentialsSentAt && (!booking.accountUid || !!booking.credentialsStatus) && <button disabled={saving === booking.id} onClick={() => paymentAction(booking)} className="rounded-lg bg-[#D4AF37] px-3 py-2 font-bold disabled:opacity-50">{saving === booking.id ? "Processing…" : booking.paymentVerifiedBy ? "Retry account & credential email" : "Verify payment & email credentials"}</button>}
          {booking.checkoutToken && <button onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/enroll#token=${booking.checkoutToken}`); setNotice("Private status link copied."); } catch { setError("Unable to copy the link."); } }} className="text-[#9a7200] underline">Copy payment status link</button>}
        </div>
      </div>}
      {booking.status !== "done" && <button onClick={() => markDone(booking.id)} disabled={saving === booking.id || booking.endsAt > now} className="mt-5 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-bold disabled:opacity-40">{saving === booking.id ? "Saving…" : "Confirm attendance & mark done"}</button>}
    </details>)}</div>}
  </section>;
}
