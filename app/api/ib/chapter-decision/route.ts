import { requireLearner } from "@/lib/server/practice";
import { ibContext } from "@/lib/server/ib-activities";
import type { Progress } from "@/lib/ib/curriculum";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { db, uid, profile } = await requireLearner(request);
    const body = await request.json();
    const { grade, path } = await ibContext(db, uid, Number(profile.grade), body.grade, body.path);
    if (path.length !== 2 || (body.decision !== "proceed" && body.decision !== "continue")) throw new Error("Invalid chapter decision.");
    const progressRef = db.doc(`ibProgress/${uid}/grades/${grade}`), key = path.join("/");
    await db.runTransaction(async tx => {
      const nodes = ((await tx.get(progressRef)).data()?.nodes || {}) as Progress;
      const state = { ...(nodes[key] || {}) };
      if (state.pendingPreTestDecision !== true) throw new Error("There is no chapter decision waiting.");
      nodes[key] = { ...state, testAttempted: true, preTestPassed: true, testPassed: body.decision === "proceed", pendingPreTestDecision: false, revision: (state.revision || 0) + 1 };
      tx.set(progressRef, { nodes }, { mergeFields: ["nodes"] });
    });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save your choice." }, { status: 400 }); }
}
