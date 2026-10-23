import { requireLearner } from "@/lib/server/practice";
import { validateContactRequest } from "@/lib/profile";
import { parseStudent } from "@/lib/admin/students";
export const runtime = "nodejs";
export async function GET(request: Request) {
  let learner;
  try { learner = await requireLearner(request); } catch { return Response.json({ error: "Student access required." }, { status: 401 }); }
  try {
    const { db, uid, profile } = learner;
    const requests = await db.collection("contactChangeRequests").where("studentUid", "==", uid).get();
    return Response.json({ profile: { ...parseStudent(uid, profile), dialCode: typeof profile.dialCode === "string" ? profile.dialCode : "" }, requests: requests.docs.map(doc => ({ ...doc.data(), id: doc.id })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to load your settings. Please retry." }, { status: 503 }); }
}
export async function POST(request: Request) {
  let learner;
  try { learner = await requireLearner(request); } catch { return Response.json({ error: "Student access required." }, { status: 401 }); }
  try {
    const input: unknown = await request.json();
    const { db, uid } = learner;
    const field = validateContactRequest(input, learner.profile).field;
    const ref = db.doc(`contactChangeRequests/${uid}_${field}`);
    await db.runTransaction(async tx => {
      const [existing, student] = await Promise.all([tx.get(ref), tx.get(db.doc(`users/${uid}`))]);
      if (existing.data()?.status === "pending") throw new Error("You already have a pending request for this contact detail.");
      if (!student.exists) throw new Error("Student profile not found.");
      const profile = student.data()!;
      const change = validateContactRequest(input, profile);
      tx.set(ref, { ...change, studentUid: uid, studentName: profile.studentName || "Student", status: "pending", requestedAt: Date.now() });
    });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to submit request." }, { status: 400 }); }
}
