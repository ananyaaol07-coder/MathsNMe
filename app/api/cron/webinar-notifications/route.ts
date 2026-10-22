import { timingSafeEqual } from "node:crypto";
import { serverDb } from "@/lib/server/firebase";
import { deliverNotification } from "@/lib/server/webinar-mail";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  const provided = request.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || Buffer.byteLength(provided) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const jobs = await serverDb().collection("webinarNotifications").where("dueAt", ">", 0).where("dueAt", "<=", Date.now()).orderBy("dueAt").limit(25).get();
    for (const job of jobs.docs) await deliverNotification(job.id);
    return Response.json({ processed: jobs.size });
  } catch { return Response.json({ error: "Notification processing failed." }, { status: 503 }); }
}
