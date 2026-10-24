import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { requireLearner } from "@/lib/server/practice";
import { readWaygroundReport } from "@/lib/reports/wayground";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { uid, db } = await requireLearner(request);
    const snapshot = await db.collection(`studentReports/${uid}/items`).orderBy("capturedAt", "desc").limit(100).get();
    return Response.json({ reports: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load reports." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { uid, db } = await requireLearner(request);
    const report = readWaygroundReport(await request.json());
    const fingerprint = createHash("sha256")
      .update(`${uid}|${report.learningPath.grade}|${report.learningPath.activityId}|${report.quizTitle}|${report.capturedAt}|${report.total}|${report.correct}|${report.score ?? ""}`)
      .digest("hex").slice(0, 32);
    const ref = db.doc(`studentReports/${uid}/items/${fingerprint}`);
    await ref.set({ ...report, importedAt: FieldValue.serverTimestamp() }, { merge: false });
    const path = report.learningPath;
    if (report.accuracy >= 90 && path.grade && path.moduleId && path.chapterId && path.activityId === "chapter-pre-test") {
      const progressRef = db.doc(`ibProgress/${uid}/grades/${path.grade}`), chapterKey = `${path.moduleId}/${path.chapterId}`;
      await db.runTransaction(async tx => {
        const nodes = ((await tx.get(progressRef)).data()?.nodes || {}) as Record<string, Record<string, unknown>>;
        const state = nodes[chapterKey] || {};
        if (state.testPassed !== true) nodes[chapterKey] = { ...state, pendingPreTestDecision: true, pendingPreTestReportId: fingerprint, revision: Number(state.revision || 0) + 1 };
        tx.set(progressRef, { nodes }, { mergeFields: ["nodes"] });
      });
    }
    return Response.json({ ok: true, reportId: fingerprint });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save this report." }, { status: 400 });
  }
}
