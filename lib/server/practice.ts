import { serverAuth, serverDb } from "./firebase";
import { deadline, normalizeCommitment, recordLearning, settleMissedDays, type Commitment } from "../practice/commitment";
export async function requireLearner(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("Sign in to continue.");
  const user = await serverAuth().verifyIdToken(token, true), db = serverDb();
  const profile = (await db.doc(`users/${user.uid}`).get()).data();
  if (!profile || profile.role !== "student") throw new Error("Student access required.");
  if (profile.enrollmentId) {
    const booking = (await db.doc(`webinarRegistrations/${profile.enrollmentId}`).get()).data();
    if (booking?.status !== "done" || booking.paymentStatus !== "paid" || booking.accountUid !== user.uid) throw new Error("Complete enrollment first.");
  }
  return { uid: user.uid, db, profile };
}
export async function reconcilePractice(uid: string) {
  const db = serverDb(), ref = db.doc(`practiceCommitments/${uid}`);
  const reportSnapshots = await db.collection(`studentReports/${uid}/items`).orderBy("capturedAt", "desc").limit(100).get();
  return db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return null;
    const previous = snapshot.data() as Commitment;
    const reports = await Promise.all(reportSnapshots.docs.map(report => tx.get(report.ref)));
    const now = Date.now(); let state = settleMissedDays(normalizeCommitment(previous, now), now), changed = false;
    for (const report of reports) {
      const data = report.data();
      if (!data) continue;
      if (data.practiceRewarded !== true) {
        const average = typeof data.averageSeconds === "number" && Number.isFinite(data.averageSeconds) && data.averageSeconds >= 0 ? data.averageSeconds : null;
        const total = typeof data.total === "number" && Number.isFinite(data.total) && data.total > 0 ? data.total : 1;
        state = recordLearning(state, now, average === null ? 60 : average * total);
        tx.update(report.ref, { practiceRewarded: true, practiceRewardedAt: now, practiceActivityCounted: true });
        changed = true;
      } else if (data.practiceActivityCounted !== true) {
        state = { ...state, activitiesCompleted: state.activitiesCompleted + 1 };
        tx.update(report.ref, { practiceActivityCounted: true });
        changed = true;
      }
    }
    if (changed || state.nextDate !== previous.nextDate || state.xp !== previous.xp || state.minutesCompleted !== previous.minutesCompleted || state.weeklyMinutes !== previous.weeklyMinutes || state.weekStart !== previous.weekStart || state.activitiesCompleted !== previous.activitiesCompleted) tx.set(ref, { ...state, nextDeadline: deadline(state) });
    return state;
  });
}
