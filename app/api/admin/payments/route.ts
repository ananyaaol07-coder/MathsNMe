import { requireAdmin } from "@/lib/server/firebase";
import { approvePayment } from "@/lib/server/manual-enrollment";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let uid;
  try { uid = await requireAdmin(request); } catch { return Response.json({ error: "Admin access required." }, { status: 401 }); }
  try {
    const { id, action, reference } = await request.json();
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid registration.");
    if (action === "approve" && typeof reference === "string") await approvePayment(id, uid, reference);
    else throw new Error("Invalid payment action.");
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Payment update failed." }, { status: 400 }); }
}
