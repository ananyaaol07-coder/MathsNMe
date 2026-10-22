"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { scheduledAt, WINDOW_MS, type Commitment } from "@/lib/practice/commitment";
import Link from "next/link";

export async function practiceApi(path = "", body?: object) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to continue.");
  const response = await fetch(`/api/practice${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to save. Please try again.");
  return result;
}
const PracticeContext = createContext<{ commitment: Commitment; refresh: () => Promise<void> } | null>(null);
export function usePractice() {
  const context = useContext(PracticeContext);
  if (!context) throw new Error("PracticeProvider is missing.");
  return context;
}
export default function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [time, setTime] = useState("18:00");
  const [timeZone, setTimeZone] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const refresh = useCallback(async () => {
    try { const result = await practiceApi(); setCommitment(result.commitment); setLoaded(true); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load your commitment."); }
  }, []);
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const initial = setTimeout(() => { setTimeZone(detected); setZones([...new Set([detected, "Asia/Kolkata", ...Intl.supportedValuesOf("timeZone")])].sort()); }, 0);
    const stop = onAuthStateChanged(auth, user => { setCommitment(null); setLoaded(false); if (user) void refresh(); });
    const interval = setInterval(() => { if (auth.currentUser) void refresh(); }, 30000);
    const focus = () => { if (auth.currentUser) void refresh(); };
    window.addEventListener("focus", focus);
    return () => { clearTimeout(initial); stop(); clearInterval(interval); window.removeEventListener("focus", focus); };
  }, [refresh]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { const result = await practiceApi("", { time, timeZone }); setCommitment(result.commitment); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to save commitment."); }
    finally { setBusy(false); }
  }
  if (!loaded) return <div className="min-h-[70vh] bg-[#fffdf8] p-10 text-center"><p>{error || "Loading your daily practice plan…"}</p>{error && <button onClick={refresh} className="mt-4 underline">Retry</button>}</div>;
  if (!commitment) return <main className="flex min-h-[80vh] items-center justify-center bg-[#fffdf8] p-5 text-slate-900"><form onSubmit={save} className="w-full max-w-xl rounded-3xl border border-[#eadfb9] bg-white p-8 shadow-lg">
    <p className="text-sm font-bold uppercase tracking-widest text-[#9a7200]">My daily commitment</p><h1 className="mt-3 text-3xl font-black">Make time for your maths.</h1><p className="mt-4 leading-7 text-slate-600">Choose a time you can practise every day. Complete a worksheet within 10 minutes before or after that time to grow your streak.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Daily time<input type="time" value={time} onChange={e => setTime(e.target.value)} required className="mt-2 block w-full rounded-xl border border-[#eadfb9] p-3" /></label><label className="text-sm font-bold">Your time zone<select value={timeZone} onChange={e => setTimeZone(e.target.value)} required className="mt-2 block w-full rounded-xl border border-[#eadfb9] p-3">{zones.map(zone => <option key={zone}>{zone}</option>)}</select></label></div>
    <div className="mt-6 rounded-2xl bg-[#fff8df] p-5 text-sm leading-7"><p><strong>On time:</strong> +1 streak day and +70 coins, once per day.</p><p><strong>Missed window:</strong> streak returns to 0 and −20 coins. Coins never fall below 0.</p><p>You can practise at any time. Extra practice won’t erase a streak you’ve already earned.</p></div>
    <p className="mt-4 text-sm leading-6 text-slate-500">Your commitment starts tomorrow in your chosen time zone. You can practise today without a reward or penalty. The time stays fixed; contact admin if it needs changing.</p>
    <label className="mt-5 flex gap-3 text-sm leading-6"><input type="checkbox" required className="mt-1" />I understand the time window and coin rules, and commit to this daily time.</label>
    {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}<button disabled={busy || !timeZone} className="mt-6 w-full rounded-xl bg-[#D4AF37] px-5 py-4 font-bold disabled:opacity-50">{busy ? "Saving…" : "Set my daily commitment"}</button>
  </form></main>;
  return <PracticeContext.Provider value={{ commitment, refresh }}>{error && <div role="alert" className="bg-amber-50 p-3 text-center text-sm text-amber-900">Practice totals could not refresh. <button onClick={refresh} className="underline">Retry</button></div>}{children}</PracticeContext.Provider>;
}
export function CommitmentCard() {
  const { commitment } = usePractice();
  const target = scheduledAt(commitment.nextDate, commitment.time, commitment.timeZone);
  const format = (at: number) => new Intl.DateTimeFormat("en", { timeZone: commitment.timeZone, hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }).format(at);
  return <section className="mt-7 rounded-3xl border border-[#e8d8a8] bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-[#9a7200]">MY DAILY COMMITMENT</p><h2 className="mt-2 text-2xl font-black">{commitment.time} every day <span className="text-sm font-medium text-slate-500">{commitment.timeZone}</span></h2><p className="mt-2 text-sm text-slate-600">Next completion window: {format(target - WINDOW_MS)} – {format(target + WINDOW_MS)}</p></div><Link href="/dashboard/practice" className="rounded-xl bg-[#D4AF37] px-5 py-3 text-center font-bold text-slate-950">Practise now</Link></div><p className="mt-4 text-sm leading-6 text-slate-600">Finish a worksheet in the window: <strong>+70 coins & +1 streak day.</strong> Miss it: <strong>−20 coins & streak back to 0.</strong> You can always practise outside the window. Coins stop at 0.</p>{commitment.lastSuccessDate && <p className="mt-2 text-sm text-green-700">Last successful commitment: {commitment.lastSuccessDate}</p>}</section>;
}
