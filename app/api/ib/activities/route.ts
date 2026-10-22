import { requireLearner } from "@/lib/server/practice";
import { activityDocument, ibContext, progressVersion, readActivity, requireActivity } from "@/lib/server/ib-activities";
import { applyActivity, passesTest, type Progress } from "@/lib/ib/curriculum";
import { gradeWorksheet } from "@/lib/practice/worksheet";
import { completePractice, deadline, type Commitment } from "@/lib/practice/commitment";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let learner;
  try { learner = await requireLearner(request); } catch { return Response.json({ error: "Student access required." }, { status: 401 }); }
  try {
    const { db, uid, profile } = learner, body = await request.json();
    if (body.action === "start") {
      const { grade, path, modules } = await ibContext(db, uid, Number(profile.grade), body.grade, body.path);
      const progressRef = db.doc(`ibProgress/${uid}/grades/${grade}`), sessionRef = db.collection("ibSessions").doc();
      return Response.json(await db.runTransaction(async tx => {
        const progress = ((await tx.get(progressRef)).data()?.nodes || {}) as Progress;
        const { view, activity } = requireActivity(modules, path, progress, body.activity);
        const nodeKey = path.join("/");
        const activeId = progress[nodeKey]?.activeTestSession;
        if (!activity.startsWith("worksheet-") && activeId) {
          const active = (await tx.get(db.doc(`ibSessions/${activeId}`))).data();
          if (active && !active.completedAt && active.activity === activity && active.version === progressVersion(path, progress)) {
            const content = readActivity({ ...active.content, published: true }, activity, view.children.map(child => child.id));
            return { sessionId: activeId, title: content.title, criteria: content.criteria, startedAt: active.startedAt, questions: content.questions.map(({ id, prompt, points }) => ({ id, prompt, points })) };
          }
        }
        const content = readActivity((await tx.get(db.doc(activityDocument(grade, path, activity)))).data(), activity, view.children.map(child => child.id));
        const startedAt = Date.now();
        if (!activity.startsWith("worksheet-")) tx.set(progressRef, { nodes: { ...progress, [nodeKey]: { ...(progress[nodeKey] || {}), activeTestSession: sessionRef.id } } }, { mergeFields: ["nodes"] });
        tx.create(sessionRef, { uid, grade, path, activity, content, startedAt, version: progressVersion(path, progress), completedAt: null });
        return { sessionId: sessionRef.id, title: content.title, criteria: content.criteria, startedAt, questions: content.questions.map(({ id, prompt, points }) => ({ id, prompt, points })) };
      }));
    }
    if (body.action !== "complete" || typeof body.sessionId !== "string" || !/^[A-Za-z0-9]{20}$/.test(body.sessionId)) throw new Error("Invalid assessment session.");
    const sessionRef = db.doc(`ibSessions/${body.sessionId}`);
    const session = (await sessionRef.get()).data();
    if (!session || session.uid !== uid) throw new Error("Session not found.");
    const { grade, path, modules } = await ibContext(db, uid, Number(profile.grade), session.grade, session.path);
    const progressRef = db.doc(`ibProgress/${uid}/grades/${grade}`), commitmentRef = db.doc(`practiceCommitments/${uid}`);
    const result = await db.runTransaction(async tx => {
      const saved = (await tx.get(sessionRef)).data()!;
      if (saved.completedAt) return saved.result;
      const progress = ((await tx.get(progressRef)).data()?.nodes || {}) as Progress;
      const commitment = (await tx.get(commitmentRef)).data() as Commitment | undefined;
      if (saved.version !== progressVersion(path, progress)) throw new Error("Your progress changed in another session. Start this activity again.");
      const { view, activity } = requireActivity(modules, path, progress, saved.activity);
      const content = readActivity({ ...saved.content, published: true }, activity, view.children.map(child => child.id));
      const now = Date.now(), seconds = (now - saved.startedAt) / 1000;
      if (saved.activity.startsWith("worksheet-") && seconds > 86400) throw new Error("Session expired. Start again.");
      const graded = gradeWorksheet(content.questions, body.answers);
      const marks = content.questions.reduce((sum, q) => sum + q.points, 0);
      const earned = content.questions.reduce((sum, q) => sum + (gradeWorksheet([q], { [q.id]: graded.answers[q.id] }).correct ? q.points : 0), 0);
      const score = earned / marks * 100, accuracy = graded.correct / graded.total * 100;
      const passed = content.criteria ? passesTest(content.criteria, score, accuracy, seconds) : true;
      const nodes = applyActivity(modules, path, progress, activity, passed);
      let bonus = 0;
      if (activity.startsWith("worksheet-")) {
        if (!commitment) throw new Error("Set your daily practice commitment first.");
        const outcome = completePractice(commitment, now); bonus = outcome.bonus;
        tx.set(commitmentRef, { ...outcome.state, nextDeadline: deadline(outcome.state) });
      }
      const result = { passed, score, accuracy, seconds: Math.round(seconds), bonus, activity };
      tx.set(progressRef, { nodes }, { mergeFields: ["nodes"] });
      tx.update(sessionRef, { completedAt: now, answers: graded.answers, result });
      return result;
    });
    return Response.json(result);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save assessment." }, { status: 400 }); }
}
