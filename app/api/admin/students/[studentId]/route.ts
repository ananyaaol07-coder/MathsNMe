import { requireAdmin, serverDb } from "@/lib/server/firebase";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try { await requireAdmin(request); } catch { return Response.json({ error: "Admin access required." }, { status: 401 }); }
  try {
    const { studentId } = await params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(studentId)) throw new Error("Invalid student record.");
    const db = serverDb();
    const [profile, commitment, reports, practiceSessions, ibSessions, progress] = await Promise.all([
      db.doc(`users/${studentId}`).get(),
      db.doc(`practiceCommitments/${studentId}`).get(),
      db.collection(`studentReports/${studentId}/items`).orderBy("capturedAt", "desc").limit(100).get(),
      db.collection("practiceSessions").where("uid", "==", studentId).limit(100).get(),
      db.collection("ibSessions").where("uid", "==", studentId).limit(100).get(),
      db.collection(`ibProgress/${studentId}/grades`).get(),
    ]);
    if (!profile.exists) return Response.json({ error: "Student record not found." }, { status: 404 });
    const completedPractice = practiceSessions.docs.filter(doc => typeof doc.data().completedAt === "number").length;
    const completedIB = ibSessions.docs.filter(doc => typeof doc.data().completedAt === "number").length;
    return Response.json({
      commitment: commitment.exists ? commitment.data() : null,
      reports: reports.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      activity: { practiceSessions: completedPractice, ibSessions: completedIB, ibGrades: progress.docs.map(doc => ({ grade: doc.id, ...doc.data() })) },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load the student learning record." }, { status: 400 });
  }
}
