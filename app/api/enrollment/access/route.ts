import { serverAuth, serverDb } from "@/lib/server/firebase";
export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new Error("Unauthorized");
    const user = await serverAuth().verifyIdToken(token, true), db = serverDb();
    const profile = (await db.doc(`users/${user.uid}`).get()).data();
    if (!profile) throw new Error("No access");
    if (profile.enrollmentId) {
      const booking = (await db.doc(`webinarRegistrations/${profile.enrollmentId}`).get()).data();
      if (booking?.status !== "done" || booking.paymentStatus !== "paid" || booking.accountUid !== user.uid) throw new Error("No access");
    }
    return Response.json({ allowed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Learning access requires completed enrollment." }, { status: 403 }); }
}
