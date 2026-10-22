export const TIME_ZONE = "Asia/Kolkata";
export const SESSION_MINUTES = 60;
export const MIN_BOOKING_LEAD_MS = 3 * 60 * 60 * 1000;
export const SLOTS = ["06:00", "07:00", "18:00", "19:00", "20:00"] as const;
export const BOARDS = ["CBSE", "ICSE", "IGCSE", "IB", "State Board"] as const;
export function indiaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function slotStart(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`).getTime();
}
export function slotLabel(time: string) {
  const hour = Number(time.slice(0, 2));
  return `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
}
export function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(slotStart(date, "06:00")) && indiaDate(new Date(slotStart(date, "06:00"))) === date;
}
export type Registration = {
  parentName: string; parentPhone: string; parentEmail: string;
  studentName: string; studentPhone: string; studentEmail: string;
  samePhone: boolean; sameEmail: boolean; grade: number; board: string;
  country: string; state: string; date: string; time: string; consent: boolean;
};
export function validateRegistration(value: unknown, now = Date.now()): Registration {
  if (!value || typeof value !== "object") throw new Error("Please complete the registration form.");
  const data = value as Record<string, unknown>;
  const text = (key: string, max: number) => {
    if (typeof data[key] !== "string" || !data[key].trim() || data[key].trim().length > max) throw new Error(`Please enter a valid ${key.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
    return data[key].trim();
  };
  const parentName = text("parentName", 120), studentName = text("studentName", 120);
  const parentPhone = text("parentPhone", 30).replace(/[\s()-]/g, ""), parentEmail = text("parentEmail", 254).toLowerCase();
  const samePhone = data.samePhone === true, sameEmail = data.sameEmail === true;
  const studentPhone = samePhone ? parentPhone : text("studentPhone", 30).replace(/[\s()-]/g, "");
  const studentEmail = sameEmail ? parentEmail : text("studentEmail", 254).toLowerCase();
  if (![parentPhone, studentPhone].every(phone => /^\+[1-9]\d{7,14}$/.test(phone))) throw new Error("Enter phone numbers with a country code, for example +91 9876543210.");
  if (![parentEmail, studentEmail].every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error("Enter valid email addresses.");
  const grade = Number(data.grade), board = text("board", 30), country = text("country", 100), state = text("state", 100);
  if (!Number.isInteger(grade) || grade < 1 || grade > 12 || !(BOARDS as readonly string[]).includes(board)) throw new Error("Choose a valid grade and board.");
  const date = text("date", 10), time = text("time", 5);
  if (!validDate(date) || !(SLOTS as readonly string[]).includes(time) || slotStart(date, time) <= now) throw new Error("Choose a future date and available time.");
  if (slotStart(date, time) - now < MIN_BOOKING_LEAD_MS) throw new Error("Please register at least 3 hours before the webinar starts.");
  if (data.consent !== true) throw new Error("Please agree to be contacted about this session.");
  return { parentName, parentPhone, parentEmail, studentName, studentPhone, studentEmail, samePhone, sameEmail, grade, board, country, state, date, time, consent: true };
}
