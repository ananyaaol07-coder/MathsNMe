import { serverAuth, serverDb } from "./firebase";
import { deadline, settleMissedDays, type Commitment } from "../practice/commitment";
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
  return db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return null;
    const previous = snapshot.data() as Commitment;
    const state = settleMissedDays(previous, Date.now());
    if (state.nextDate !== previous.nextDate) tx.set(ref, { ...state, nextDeadline: deadline(state) });
    return state;
  });
}
