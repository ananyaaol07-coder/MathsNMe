import { requireAdmin, serverDb } from "@/lib/server/firebase";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { await requireAdmin(request); } catch { return Response.json({ error: "Admin access required." }, { status: 401 }); }
  try {
    const docs = await serverDb().collection("contactChangeRequests").where("status", "==", "pending").get();
    return Response.json({ requests: docs.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => Number((a as { requestedAt?: number }).requestedAt || 0) - Number((b as { requestedAt?: number }).requestedAt || 0)) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to load contact requests." }, { status: 503 }); }
}
