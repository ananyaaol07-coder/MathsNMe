import { requireLearner, reconcilePractice } from "@/lib/server/practice";
import { createCommitment, deadline, validateCommitment } from "@/lib/practice/commitment";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const { uid } = await requireLearner(request);
    return Response.json({ commitment: await reconcilePractice(uid), serverNow: Date.now() }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to load practice commitment. Sign in and try again." }, { status: 403 }); }
}
export async function POST(request: Request) {
  try {
    const { uid, db } = await requireLearner(request);
    const body = await request.json(), { time, timeZone } = validateCommitment(body.time, body.timeZone);
    const ref = db.doc(`practiceCommitments/${uid}`);
    const state = await db.runTransaction(async tx => {
      if ((await tx.get(ref)).exists) throw new Error("Your commitment is already set. Contact admin if you need to change it.");
      const commitment = createCommitment(time, timeZone, Date.now());
      tx.create(ref, { ...commitment, nextDeadline: deadline(commitment) });
      return commitment;
    });
    return Response.json({ commitment: state, serverNow: Date.now() });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save commitment." }, { status: 400 }); }
}
