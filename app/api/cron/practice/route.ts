import { timingSafeEqual } from "node:crypto";
import { serverDb } from "@/lib/server/firebase";
import { reconcilePractice } from "@/lib/server/practice";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`, provided = request.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || Buffer.byteLength(expected) !== Buffer.byteLength(provided) || !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const pending = await serverDb().collection("practiceCommitments").where("nextDeadline", "<", Date.now()).orderBy("nextDeadline").limit(100).get();
    for (const doc of pending.docs) await reconcilePractice(doc.id);
    return Response.json({ processed: pending.size, moreMayRemain: pending.size === 100 });
  } catch { return Response.json({ error: "Unable to process practice commitments." }, { status: 503 }); }
}
