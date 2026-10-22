import { serverDb } from "@/lib/server/firebase";
import { MIN_BOOKING_LEAD_MS, SLOTS, slotStart, validDate } from "@/lib/webinar/schedule";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") || "";
  if (!validDate(date)) return Response.json({ error: "Choose a valid date." }, { status: 400 });
  try {
    const db = serverDb();
    const docs = await db.getAll(...SLOTS.map(time => db.doc(`webinarSlots/${date}_${time.replace(":", "")}`)));
    const now = Date.now();
    return Response.json({ now, slots: SLOTS.map((time, i) => ({ time, status: docs[i].data()?.status === "done" ? "completed" : docs[i].exists ? "booked" : slotStart(date, time) - now < MIN_BOOKING_LEAD_MS ? "past" : "available" })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Availability is temporarily unavailable. Please try again shortly." }, { status: 503 }); }
}
