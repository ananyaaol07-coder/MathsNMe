import { activityDocument, readActivity } from "@/lib/server/ib-activities";
import { requireLearner } from "@/lib/server/practice";
import { IB_GRADES, canAccessGrade, curriculumView, curriculumWithPlaceholders, externalActivityLink, hasChapterTests, isAutomaticGrade, validGrade, type Progress } from "@/lib/ib/curriculum";
import type { ReportLocation } from "@/lib/reports/wayground";
export const runtime = "nodejs";
export async function GET(request: Request) {
  let learner;
  try { learner = await requireLearner(request); } catch { return Response.json({ error: "Student access required." }, { status: 401 }); }
  try {
    const { db, uid, profile } = learner;
    const requests = await db.collection("ibGradeRequests").where("studentUid", "==", uid).get();
    const statuses = Object.fromEntries(requests.docs.map(doc => [doc.data().grade, doc.data().status]));
    const raw = new URL(request.url).searchParams.get("path") || "";
    const segments = raw ? raw.split("/") : [];
    const registeredGrade = Number(profile.grade);
    const grades = IB_GRADES.map(grade => ({ grade, own: grade === registeredGrade, previous: grade === registeredGrade - 1, automatic: isAutomaticGrade(registeredGrade, grade), accessible: canAccessGrade(registeredGrade, grade, statuses[grade]), status: statuses[grade] || null }));
    if (!segments.length) return Response.json({ grades, registeredGrade }, { headers: { "Cache-Control": "no-store" } });
    const grade = Number(segments[0]);
    if (String(grade) !== segments[0] || !validGrade(grade) || !canAccessGrade(registeredGrade, grade, statuses[grade])) return Response.json({ error: "This grade is locked. Request admin approval from the grade cards." }, { status: 403 });
    const curriculum = (await db.doc(`ibCurricula/${grade}`).get()).data();
    const modules = curriculumWithPlaceholders(curriculum?.modules, grade);
    const progress = (await db.doc(`ibProgress/${uid}/grades/${grade}`).get()).data()?.nodes as Progress | undefined;
    const chapterTests = hasChapterTests(registeredGrade, grade);
    const contentPath = segments.slice(1);
    const view = curriculumView(modules, contentPath, progress || {}, { chapterTests });
    const chapterDecision = contentPath.length === 2 && (progress || {})[contentPath.join("/")]?.pendingPreTestDecision === true;
    const activities = await Promise.all(view.activities.map(async item => {
      const externalUrl = externalActivityLink(grade, segments.slice(1), item.id);
      const moduleNode = view.breadcrumbs[0];
      const chapter = view.breadcrumbs[1];
      const exercise = view.breadcrumbs[2];
      const reportLocation: ReportLocation = {
        grade,
        moduleId: moduleNode?.id || "module-not-set", moduleTitle: moduleNode?.title || "Module not set",
        chapterId: chapter?.id || "chapter-not-set", chapterTitle: chapter?.title || "Chapter not set",
        exerciseId: exercise?.id || "chapter-assessments", exerciseTitle: exercise?.title || "Chapter assessments",
        activityId: item.id, activityTitle: item.title,
      };
      if (externalUrl) return { ...item, configured: true, criteria: null, externalUrl, reportLocation };
      try {
        const content = readActivity((await db.doc(activityDocument(grade, segments.slice(1), item.id)).get()).data(), item.id, view.children.map(child => child.id));
        return { ...item, configured: true, criteria: content.criteria, externalUrl: null };
      } catch { return { ...item, configured: false, criteria: null, externalUrl: null }; }
    }));
    return Response.json({ ...view, activities, grade, registeredGrade, chapterTests, chapterDecision }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load IB Mathematics." }, { status: 400 }); }
}
export async function POST(request: Request) {
  let learner;
  try { learner = await requireLearner(request); } catch { return Response.json({ error: "Student access required." }, { status: 401 }); }
  try {
    const { db, uid, profile } = learner, { grade } = await request.json();
    if (!validGrade(grade) || isAutomaticGrade(Number(profile.grade), grade)) throw new Error("This grade is already included in the child’s learning path.");
    const ref = db.doc(`ibGradeRequests/${uid}_${grade}`);
    await db.runTransaction(async tx => {
      const current = (await tx.get(ref)).data();
      if (current?.status === "pending" || current?.status === "approved") return;
      if (current?.status === "rejected") throw new Error("This request was declined. Please contact admin to discuss access.");
      tx.create(ref, { studentUid: uid, studentName: profile.studentName, registeredGrade: Number(profile.grade), grade, status: "pending", requestedAt: Date.now() });
    });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to request access." }, { status: 400 }); }
}
