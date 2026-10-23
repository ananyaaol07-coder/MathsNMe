"use client";
import { useCallback, useEffect, useState } from "react";
import { Settings, UserRound, Mail, Phone, Clock3 } from "lucide-react";
import { type AdminStudent, dateLabel, levelLabel } from "@/lib/admin/students";
import { type ContactField, type ContactRequest } from "@/lib/profile";
import { profileApi } from "@/lib/profile-client";
const inputClass = "mt-2 w-full rounded-xl border border-[#e5dcc5] bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20";
export default function SettingsPage() {
  const [profile, setProfile] = useState<(AdminStudent & { dialCode: string }) | null>(null);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [field, setField] = useState<ContactField>("email");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await profileApi("/api/profile"); setProfile(data.profile); setRequests(data.requests); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load settings."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  const pending = requests.some(request => request.field === field && request.status === "pending");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      await profileApi("/api/profile", { field, value, reason });
      setValue(""); setReason("");
      setMessage("Your request has been sent to the admin. Your current contact details remain in use while it is reviewed.");
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to submit request."); }
    finally { setBusy(false); }
  }
  const phone = profile?.phone.startsWith("+") ? profile.phone : [profile?.dialCode, profile?.phone].filter(Boolean).join(" ");
  return <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF8EA] px-5 py-10 text-slate-900 sm:px-8"><div className="mx-auto max-w-6xl">
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#9a7200]"><Settings size={17} />Your account</p>
    <h1 className="mt-3 text-3xl font-black sm:text-4xl">Settings</h1><p className="mt-3 text-slate-500">Your child’s profile and family contact details, in one place.</p>
    {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button type="button" onClick={load} disabled={busy || loading} className="ml-3 font-bold underline">Refresh</button></div>}
    {message && <p role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}
    {loading && <p role="status" className="mt-8 text-slate-500">Loading your details…</p>}
    {profile && <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6"><section className="rounded-3xl border border-[#eadfb9] bg-white p-6 sm:p-8"><div className="flex items-center gap-4"><span className="rounded-2xl bg-[#fff4cc] p-3 text-[#9a7200]"><UserRound size={28} /></span><div><h2 className="text-xl font-bold">{profile.studentName}</h2><p className="mt-1 text-sm text-slate-500">Student profile</p></div></div><dl className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2">{[
        ["Grade", profile.grade ? `Grade ${profile.grade}` : "Not recorded"], ["School board", profile.board], ["Country", profile.country], ["State / region", profile.state], ["City", profile.city], ["Current level", levelLabel(profile.currentLevel)], ["Pre-test", profile.pretestCompleted ? "Completed" : "Pending"], ["Registered on", dateLabel(profile.createdAt)],
      ].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-2 break-words text-sm font-semibold">{value || "Not recorded"}</dd></div>)}</dl></section>
      <section className="rounded-3xl border border-[#eadfb9] bg-white p-6 sm:p-8"><h2 className="text-xl font-bold">Contact details</h2><div className="mt-6 flex items-start gap-3"><Mail size={20} className="shrink-0 text-[#9a7200]" /><div className="min-w-0"><p className="text-xs text-slate-500">Parent / guardian email</p><p className="mt-1 break-words font-semibold">{profile.guardianEmail || "Not recorded"}</p></div></div><div className="mt-5 flex items-start gap-3"><Phone size={20} className="text-[#9a7200]" /><div><p className="text-xs text-slate-500">Phone number</p><p className="mt-1 font-semibold">{phone || "Not recorded"}</p></div></div></section></div>
      <div className="space-y-6"><section className="rounded-3xl border border-[#eadfb9] bg-white p-6 sm:p-8"><h2 className="text-xl font-bold">Request a contact change</h2><p className="mt-3 text-sm leading-6 text-slate-500">Need to update your email or phone number? Send a request for the admin to review and follow up with your parent or guardian.</p><form onSubmit={submit} className="mt-6 space-y-5"><fieldset disabled={busy} className="space-y-5"><label className="block text-sm font-semibold">What would you like to change?<select value={field} onChange={event => { setField(event.target.value as ContactField); setValue(""); setMessage(""); }} className={inputClass}><option value="email">Email address</option><option value="phone">Phone number</option></select></label>{pending ? <p className="rounded-xl bg-[#fff8df] p-4 text-sm text-[#8a6500]">A request for this contact detail is already awaiting admin review.</p> : <><label className="block text-sm font-semibold">{field === "email" ? "New email address" : "New phone number (with country code)"}<input required type={field === "email" ? "email" : "tel"} maxLength={field === "email" ? 320 : 40} value={value} onChange={event => setValue(event.target.value)} placeholder={field === "email" ? "parent@example.com" : "+91 98765 43210"} className={inputClass} /></label><label className="block text-sm font-semibold">Reason <span className="font-normal text-slate-500">(optional)</span><textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} rows={3} className={inputClass} placeholder="Tell us why you need this change." /></label><button disabled={busy || loading} className="w-full rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-slate-950 hover:bg-[#c79d18] disabled:opacity-50">{busy ? "Sending request…" : "Send request to admin"}</button></>}</fieldset></form></section>
      <section className="rounded-3xl border border-[#eadfb9] bg-white p-6 sm:p-8"><h2 className="flex items-center gap-2 text-lg font-bold"><Clock3 size={20} className="text-[#9a7200]" />Latest requests</h2>{requests.length === 0 ? <p className="mt-4 text-sm text-slate-500">You haven’t requested any contact changes yet.</p> : <ul className="mt-5 space-y-5">{requests.map(request => <li key={request.id} className="border-t border-slate-100 pt-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{request.field === "email" ? "Email address" : "Phone number"}</p><span className="rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-bold capitalize text-[#8a6500]">{request.status === "pending" ? "Awaiting review" : request.status}</span></div><p className="mt-2 break-words text-sm text-slate-600">{request.requestedValue}</p><p className="mt-2 text-xs text-slate-400">Requested {dateLabel(request.requestedAt)}</p></li>)}</ul>}</section></div>
    </div>}
  </div></div>;
}
