import { countries } from "@/lib/countries";
import { createHash } from "node:crypto";
import { after } from "next/server";
import { serverDb } from "@/lib/server/firebase";
import { deliverNotification } from "@/lib/server/webinar-mail";
import { SESSION_MINUTES, slotStart, validateRegistration } from "@/lib/webinar/schedule";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  let data: ReturnType<typeof validateRegistration>, id: string;
  try {
    const body = await request.text();
    if (body.length > 12000) throw new Error("Form is too large.");
    const raw = JSON.parse(body);
    if (raw.website) throw new Error("Unable to accept registration.");
    id = raw.requestId;
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id)) throw new Error("Reload the form and try again.");
    data = validateRegistration(raw);
    if (!countries.some(country => country.name === data.country)) throw new Error("Choose a valid country.");
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid form." }, { status: 400 }); }
  try {
    const db = serverDb(), ref = db.doc(`webinarRegistrations/${id}`);
    const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    const slotId = `${data.date}_${data.time.replace(":", "")}`;
    const slot = db.doc(`webinarSlots/${slotId}`);
    // Limit repeated reservations using one parent's email without exposing it in document IDs.
    const guard = db.doc(`webinarLimits/${createHash("sha256").update(data.parentEmail + data.date).digest("hex")}`);
    await db.runTransaction(async tx => {
      const [existing, reserved, limit] = await Promise.all([tx.get(ref), tx.get(slot), tx.get(guard)]);
      if (existing.exists) { if (existing.data()?.payloadHash !== hash) throw new Error("REQUEST_CHANGED"); return; }
      if (slotStart(data.date, data.time) <= Date.now()) throw new Error("SLOT_TAKEN");
      if (reserved.exists) throw new Error("SLOT_TAKEN");
      if (limit.exists) throw new Error("DAILY_LIMIT");
      const startsAt = slotStart(data.date, data.time), endsAt = startsAt + SESSION_MINUTES * 60000;
      tx.create(ref, { ...data, payloadHash: hash, slotId, startsAt, endsAt, status: "booked", createdAt: Date.now() });
      tx.create(slot, { date: data.date, time: data.time, bookingId: id, status: "booked" });
      tx.create(guard, { bookingId: id });
      tx.create(db.doc(`webinarNotifications/${id}-registered`), { bookingId: id, kind: "registration", dueAt: Date.now(), sentAt: null });
      tx.create(db.doc(`webinarNotifications/${id}-reminder`), { bookingId: id, kind: "reminder", dueAt: endsAt, sentAt: null });
    });
    after(() => deliverNotification(`${id}-registered`));
    return Response.json({ id, message: "Your session is booked. Admin will contact you with the Zoom link." });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = { SLOT_TAKEN: "This slot has just become unavailable. Please choose another.", DAILY_LIMIT: "You already have a reservation for this date. Contact us if you need to change it.", REQUEST_CHANGED: "This registration was already submitted. Refresh to start a new form." };
    return Response.json({ error: messages[code] || "Booking is temporarily unavailable. Please try again." }, { status: messages[code] ? 409 : 503 });
  }
}
