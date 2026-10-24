export const WINDOW_MS = 10 * 60 * 1000;
const DAY_MS = 86400000;
export type Commitment = {
  time: string; timeZone: string; startDate: string; nextDate: string;
  streak: number; coins: number; lastSuccessDate: string | null;
  successfulDays: number; missedDays: number; worksheetsDone: number;
  xp: number; minutesCompleted: number; weeklyMinutes: number; weekStart: string; activitiesCompleted: number;
};
const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string) {
  let value = formatters.get(timeZone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    formatters.set(timeZone, value);
  }
  return value;
}
function parts(at: number, timeZone: string) {
  return Object.fromEntries(formatter(timeZone).formatToParts(at).map(part => [part.type, part.value]));
}
export function localDate(at: number, timeZone: string) {
  const p = parts(at, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}
export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
export function weekStartDate(at: number, timeZone: string) {
  const date = localDate(at, timeZone), weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}
export function normalizeCommitment(state: Commitment, now: number): Commitment {
  const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;
  const weekStart = weekStartDate(now, state.timeZone);
  return { ...state, xp: number(state.xp), minutesCompleted: number(state.minutesCompleted), weeklyMinutes: state.weekStart === weekStart ? number(state.weeklyMinutes) : 0, weekStart, activitiesCompleted: number(state.activitiesCompleted) };
}
export function recordLearning(original: Commitment, now: number, seconds: number, xp = 10) {
  const state = normalizeCommitment(original, now), minutes = Math.max(1, Math.ceil(Math.max(0, seconds) / 60));
  return { ...state, xp: state.xp + xp, minutesCompleted: state.minutesCompleted + minutes, weeklyMinutes: state.weeklyMinutes + minutes, activitiesCompleted: state.activitiesCompleted + 1 };
}
function wallClock(at: number, timeZone: string) {
  const p = parts(at, timeZone);
  return Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
}
export function validateCommitment(time: unknown, timeZone: unknown) {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Choose a valid daily practice time.");
  if (typeof timeZone !== "string" || timeZone.length > 100) throw new Error("Choose your time zone.");
  try { formatter(timeZone).format(); } catch { throw new Error("Choose a valid time zone."); }
  return { time, timeZone };
}
// Resolve the stored local time without trusting the browser clock. On a DST
// overlap use the first occurrence; on a skipped hour move forward by the gap.
export function scheduledAt(date: string, time: string, timeZone: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  const offsets = new Set([-DAY_MS, 0, DAY_MS].map(delta => wallClock(wall + delta, timeZone) - (wall + delta)));
  const candidates = [...offsets].map(offset => wall - offset).sort((a, b) => a - b);
  return candidates.find(candidate => wallClock(candidate, timeZone) === wall) ?? candidates[candidates.length - 1];
}
export function deadline(state: Commitment) { return scheduledAt(state.nextDate, state.time, state.timeZone) + WINDOW_MS; }
export function createCommitment(time: string, timeZone: string, now: number): Commitment {
  validateCommitment(time, timeZone);
  const startDate = addDays(localDate(now, timeZone), 1);
  return { time, timeZone, startDate, nextDate: startDate, streak: 0, coins: 0, lastSuccessDate: null, successfulDays: 0, missedDays: 0, worksheetsDone: 0, xp: 0, minutesCompleted: 0, weeklyMinutes: 0, weekStart: weekStartDate(now, timeZone), activitiesCompleted: 0 };
}
export function settleMissedDays(original: Commitment, now: number): Commitment {
  const state = normalizeCommitment(original, now);
  // Windows can cross midnight: yesterday's late-night window may still be open.
  let lastExpired = addDays(localDate(now, state.timeZone), 1);
  while (scheduledAt(lastExpired, state.time, state.timeZone) + WINDOW_MS >= now) lastExpired = addDays(lastExpired, -1);
  if (lastExpired < state.nextDate) return state;
  const missed = Math.round((Date.parse(lastExpired) - Date.parse(state.nextDate)) / DAY_MS) + 1;
  return { ...state, streak: 0, coins: Math.max(0, state.coins - missed * 20), missedDays: state.missedDays + missed, nextDate: addDays(lastExpired, 1) };
}
export function completePractice(original: Commitment, now: number, seconds = 0) {
  const state = recordLearning(settleMissedDays(original, now), now, seconds);
  const today = localDate(now, state.timeZone);
  const day = [-1, 0, 1].map(delta => addDays(today, delta)).find(date => Math.abs(now - scheduledAt(date, state.time, state.timeZone)) <= WINDOW_MS);
  if (!day || day < state.nextDate || day < state.startDate) return { state: { ...state, worksheetsDone: state.worksheetsDone + 1 }, bonus: 0, onTime: false };
  return { state: { ...state, streak: state.lastSuccessDate === addDays(day, -1) ? state.streak + 1 : 1, coins: state.coins + 70, successfulDays: state.successfulDays + 1, lastSuccessDate: day, nextDate: addDays(day, 1), worksheetsDone: state.worksheetsDone + 1 }, bonus: 70, onTime: true };
}
