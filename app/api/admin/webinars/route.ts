import { createHash, randomBytes } from "node:crypto";
import { requireAdmin, serverDb } from "@/lib/server/firebase";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { await requireAdmin(request); } catch { return Response.json({ error: "Admin access required." }, { status: 401 }); }
  try {
    const docs = await serverDb().collection("webinarRegistrations").orderBy("startsAt", "desc").limit(500).get();
    return Response.json({ registrations: docs.docs.map(doc => { const data = doc.data(); delete data.payloadHash; return { id: doc.id, ...data }; }) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to load registrations." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  let uid;
  try { uid = await requireAdmin(request); } catch { return Response.json({ error: "Admin access required." }, { status: 401 }); }
  try {
    const { id } = await request.json();
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id)) return Response.json({ error: "Invalid booking." }, { status: 400 });
    const db = serverDb(), ref = db.doc(`webinarRegistrations/${id}`);
    await db.runTransaction(async tx => {
      const booking = (await tx.get(ref)).data();
      if (!booking || booking.endsAt > Date.now()) throw new Error("Session has not ended.");
      const checkoutToken = booking.checkoutToken || randomBytes(32).toString("hex");
      tx.set(db.doc(`webinarInvites/${createHash("sha256").update(checkoutToken).digest("hex")}`), { bookingId: id });
      tx.update(ref, { status: "done", completedAt: booking.completedAt || Date.now(), completedBy: uid, checkoutToken });
      tx.update(db.doc(`webinarSlots/${booking.slotId}`), { status: "done" });
    });
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Unable to mark this session done. Check that its scheduled end time has passed." }, { status: 400 }); }
}
