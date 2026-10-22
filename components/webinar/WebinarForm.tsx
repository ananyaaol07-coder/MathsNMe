"use client";

import { useEffect, useState } from "react";
import { countries } from "@/lib/countries";
import { BOARDS, indiaDate, SLOTS, slotLabel } from "@/lib/webinar/schedule";

type Availability = { time: string; status: "available" | "booked" | "past" | "completed" };

const field = "mt-2 block w-full rounded-xl border border-[#e5dcc5] bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#D4AF37]/20 disabled:bg-slate-100 disabled:text-slate-500";
const label = "block text-sm font-semibold text-slate-700";
export default function WebinarForm() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [today, setToday] = useState("");
  const [samePhone, setSamePhone] = useState(true);
  const [sameEmail, setSameEmail] = useState(true);
  const [parentDial, setParentDial] = useState("+91");
  const [studentDial, setStudentDial] = useState("+91");
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [requestId, setRequestId] = useState("");
  useEffect(() => {
    const tick = () => { setToday(indiaDate()); };
    const initial = setTimeout(() => { tick(); setRequestId(crypto.randomUUID()); }, 0);
    const timer = setInterval(tick, 10000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    fetch(`/api/webinar/availability?date=${encodeURIComponent(date)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); return result; })
      .then(result => setSlots(result.slots))
      .catch(error => { if (error.name !== "AbortError") { setSlots([]); setAvailabilityError("Unable to check availability."); } })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [date]);
  const selectedAvailable = slots.some(slot => slot.time === time && slot.status === "available");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !selectedAvailable) return;
    setSubmitting(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parentPhone = `${parentDial}${String(values.parentPhoneNumber || "").replace(/\D/g, "")}`;
    const studentPhone = samePhone ? parentPhone : `${studentDial}${String(values.studentPhoneNumber || "").replace(/\D/g, "")}`;
    try {
      const response = await fetch("/api/webinar/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, parentPhone, studentPhone, date, time, samePhone, sameEmail, grade: Number(values.grade), consent: values.consent === "on", requestId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setConfirmation(result.id);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to book. Try again."); }
    finally { setSubmitting(false); }
  }
  function timeButtons() {
    return (
      <div role="group" aria-label="Session times" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SLOTS.map(value => {
          const status = slots.find(slot => slot.time === value)?.status;
          const checking = !date || loading || Boolean(availabilityError) || slots.length === 0;
          const available = !checking && status === "available";
          const description = !date ? "Choose a date first" : loading || slots.length === 0 ? "Checking availability" : availabilityError ? "Unavailable" : status === "booked" ? "Booked" : status === "past" ? "Past or under 3 hours" : status === "completed" ? "Completed" : "Available";
          return <button key={value} type="button" disabled={submitting || !available} aria-pressed={time === value} onClick={() => setTime(value)} className={`rounded-xl border px-3 py-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 ${checking ? "border-slate-200 bg-slate-50 text-slate-400" : available ? "border-green-300 bg-green-50 text-green-800 hover:bg-green-100" : "border-red-200 bg-red-50 text-red-700"} ${time === value ? "ring-2 ring-green-700 ring-offset-2" : ""}`}>
            <span>{slotLabel(value)}</span><span className="mt-1 block text-xs font-normal">{description}</span>
          </button>
        })}
      </div>
    );
  }
  if (confirmation) return <div role="status" className="rounded-3xl border border-green-200 bg-white p-8 shadow-lg">
    <p className="font-bold text-green-700">Your session is booked</p><h2 className="mt-3 text-2xl font-bold text-slate-900">{date} · {slotLabel(time)} IST</h2>
    <p className="mt-4 leading-7 text-slate-600">Set aside 60 minutes for your one-to-one parent webinar. Admin will contact you with your Zoom link.</p>
    <p className="mt-4 break-all text-sm text-slate-500">Booking reference: {confirmation}</p>
    <p className="mt-6 text-sm text-slate-600">Need help? Email <a className="font-semibold text-[#9a7200] underline" href="mailto:rameshaol@gmail.com">rameshaol@gmail.com</a>.</p>
  </div>;
  return <form onSubmit={submit} className="space-y-8 rounded-3xl border border-[#eadfb9] bg-white p-6 shadow-lg sm:p-9">
    <fieldset disabled={submitting} className="space-y-8 disabled:opacity-70">
      <fieldset><legend className="text-xl font-bold text-slate-900">Parent details</legend><div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className={label}>Parent name<input name="parentName" autoComplete="name" required maxLength={120} className={field} /></label>
        <label className={label}>Mobile number<div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row"><select aria-label="Parent country code" value={parentDial} onChange={event => setParentDial(event.target.value)} className={`${field} mt-0 w-full min-w-0 px-2 sm:w-32 sm:shrink-0`}>{countries.map(country => <option key={country.code} value={country.dialCode}>{country.name} ({country.dialCode})</option>)}</select><input name="parentPhoneNumber" type="tel" autoComplete="tel-national" placeholder="9876543210" required maxLength={18} pattern="[0-9 ]{6,16}" className={`${field} mt-0 min-w-0`} /></div></label>
        <label className={`${label} sm:col-span-2`}>Email address<input name="parentEmail" type="email" autoComplete="email" required maxLength={254} className={field} /></label>
      </div></fieldset>
      <fieldset><legend className="text-xl font-bold text-slate-900">Student details</legend><div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>Student name<input name="studentName" required maxLength={120} className={field} /></label>
        <div><label className={label}>Student mobile number<div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row"><select aria-label="Student country code" value={studentDial} onChange={event => setStudentDial(event.target.value)} disabled={samePhone} className={`${field} mt-0 w-full min-w-0 px-2 sm:w-32 sm:shrink-0`}><option value={parentDial}>Same as parent ({parentDial})</option>{countries.map(country => <option key={country.code} value={country.dialCode}>{country.name} ({country.dialCode})</option>)}</select><input name="studentPhoneNumber" type="tel" placeholder={samePhone ? "Using parent’s mobile number" : "9876543210"} required={!samePhone} disabled={samePhone} maxLength={18} pattern="[0-9 ]{6,16}" className={`${field} mt-0 min-w-0`} /></div></label><label className="mt-3 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={samePhone} onChange={event => setSamePhone(event.target.checked)} />Same as parent’s phone number</label></div>
        <div><label className={label}>Student email<input name="studentEmail" type="email" placeholder={sameEmail ? "Using parent’s email" : "Student email address"} required={!sameEmail} disabled={sameEmail} maxLength={254} className={field} /></label><label className="mt-3 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={sameEmail} onChange={event => setSameEmail(event.target.checked)} />Same as parent’s email</label></div>
        <label className={label}>Grade<select name="grade" required defaultValue="" className={field}><option value="" disabled>Select grade</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Grade {i + 1}</option>)}</select></label>
        <label className={label}>Board<select name="board" required defaultValue="" className={field}><option value="" disabled>Select board</option>{BOARDS.map(board => <option key={board}>{board}</option>)}</select></label>
        <label className={label}>Country<select name="country" defaultValue="India" required className={field}>{countries.map(country => <option key={country.code}>{country.name}</option>)}</select></label>
        <label className={label}>State / region<input name="state" autoComplete="address-level1" required maxLength={100} className={field} /></label>
      </div></fieldset>
      <fieldset><legend className="text-xl font-bold text-slate-900">Choose your session</legend>
        <p className="mt-2 text-sm leading-6 text-slate-600">60 minutes · Zoom · All times are India Standard Time (IST, UTC+5:30).</p>
        <label className={`${label} mt-5`}>Suitable date<input id="webinar-date" name="date" type="date" min={today} value={date} disabled={!today} onChange={event => { setDate(event.target.value); setTime(""); setSlots([]); setLoading(Boolean(event.target.value)); setAvailabilityError(""); }} required className={field} /></label>
        <div className="mt-5">{timeButtons()}</div>
        {availabilityError && <p role="alert" className="mt-3 text-sm text-red-700">{availabilityError}</p>}
      </fieldset>
      <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input name="consent" type="checkbox" required className="mt-1.5" />I am the parent or guardian and agree that MathsNMe may use these details to arrange and follow up on this webinar.</label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <button disabled={submitting || !selectedAvailable || !requestId} className="w-full rounded-xl bg-[#D4AF37] px-6 py-4 font-bold text-slate-950 shadow-sm hover:bg-[#e0bd4a] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "Reserving your session…" : "Book my parent webinar"}</button>
    </fieldset>
  </form>;
}
