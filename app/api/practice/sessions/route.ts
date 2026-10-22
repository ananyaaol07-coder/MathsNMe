import { requireLearner } from "@/lib/server/practice";
import { completePractice, deadline, type Commitment } from "@/lib/practice/commitment";
import { gradeWorksheet, readWorksheet } from "@/lib/practice/worksheet";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const { uid, db } = await requireLearner(request);
    const body = await request.json();
    if (body.action === "start") {
      if (typeof body.worksheetId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(body.worksheetId)) throw new Error("Invalid worksheet.");
      const state = await db.doc(`practiceCommitments/${uid}`).get();
      if (!state.exists) throw new Error("Set your daily practice commitment first.");
      const worksheet = readWorksheet((await db.doc(`practiceWorksheets/${body.worksheetId}`).get()).data());
      if (worksheet.topicId === "ib-mathematics") throw new Error("Open IB Mathematics through your grade learning path. Topic activities are not available yet.");
      const ref = db.collection("practiceSessions").doc();
      // Immutable private snapshot keeps grading consistent if content is edited.
      await ref.create({ uid, worksheetId: body.worksheetId, worksheet, startedAt: Date.now(), completedAt: null });
      return Response.json({ sessionId: ref.id, title: worksheet.title, questions: worksheet.questions.map(({ id, prompt }) => ({ id, prompt })) });
    }
    if (body.action !== "complete" || typeof body.sessionId !== "string" || !/^[A-Za-z0-9]{20}$/.test(body.sessionId)) throw new Error("Invalid practice session.");
    const sessionRef = db.doc(`practiceSessions/${body.sessionId}`), stateRef = db.doc(`practiceCommitments/${uid}`);
    const result = await db.runTransaction(async tx => {
      const session = (await tx.get(sessionRef)).data(), snapshot = await tx.get(stateRef);
      if (!session || session.uid !== uid || !snapshot.exists) throw new Error("Practice session not found.");
      // A retry returns the original outcome without rewarding the worksheet again.
      if (session.completedAt) return session.result;
      const now = Date.now();
      if (now - session.startedAt > 24 * 60 * 60 * 1000) throw new Error("This session expired. Start a fresh worksheet.");
      const worksheet = readWorksheet(session.worksheet);
      if (worksheet.topicId === "ib-mathematics") throw new Error("IB topic activities are not available yet.");
      const graded = gradeWorksheet(worksheet.questions, body.answers);
      const outcome = completePractice(snapshot.data() as Commitment, now);
      const result = { correct: graded.correct, total: graded.total, accuracy: graded.accuracy, bonus: outcome.bonus, onTime: outcome.onTime, commitment: outcome.state };
      tx.set(stateRef, { ...outcome.state, nextDeadline: deadline(outcome.state) });
      tx.update(sessionRef, { completedAt: now, answers: graded.answers, result });
      return result;
    });
    return Response.json(result);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save practice." }, { status: 400 }); }
}
