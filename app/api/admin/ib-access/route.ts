import { requireAdmin, serverDb } from "@/lib/server/firebase";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { await requireAdmin(request); } catch { return Response.json({ error: "Admin access required." }, { status: 401 }); }
  try {
    const docs = await serverDb().collection("ibGradeRequests").orderBy("requestedAt", "desc").limit(200).get();
    return Response.json({ requests: docs.docs.map(doc => ({ id: doc.id, ...doc.data() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to load grade requests." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  let admin;
  try { admin = await requireAdmin(request); } catch { return Response.json({ error: "Admin access required." }, { status: 401 }); }
  try {
    const { id, decision } = await request.json();
    if (typeof id !== "string" || !id || id.length > 150 || id.includes("/") || !["approved", "rejected"].includes(decision)) throw new Error("Invalid access decision.");
    const db = serverDb(), ref = db.doc(`ibGradeRequests/${id}`);
    await db.runTransaction(async tx => {
      const existing = (await tx.get(ref)).data();
      if (!existing) throw new Error("Request not found.");
      if (existing.status === decision) return;
      tx.update(ref, { status: decision, reviewedBy: admin, reviewedAt: Date.now() });
    });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to review request." }, { status: 400 }); }
}
