import { curriculumView, curriculumWithPlaceholders, canAccessGrade, hasChapterTests, validGrade, validateCriteria, type Activity, type Progress } from "../ib/curriculum";
import { readWorksheet, type PracticeQuestion } from "../practice/worksheet";
import type { Firestore } from "firebase-admin/firestore";
export function activityDocument(grade: number, path: string[], activity: string) { return `ibActivities/${grade}_${path.join("_")}_${activity}`; }
export async function ibContext(db: Firestore, uid: string, registeredGrade: number, grade: unknown, path: unknown) {
  if (!validGrade(grade) || !Array.isArray(path) || path.length < 2 || path.length > 3 || path.some(segment => typeof segment !== "string" || !/^[a-z0-9-]{1,60}$/.test(segment))) throw new Error("Invalid learning path.");
  const approval = (await db.doc(`ibGradeRequests/${uid}_${grade}`).get()).data()?.status;
  if (!canAccessGrade(registeredGrade, grade, approval)) throw new Error("This grade is locked.");
  const curriculum = (await db.doc(`ibCurricula/${grade}`).get()).data();
  return { grade, path: path as string[], modules: curriculumWithPlaceholders(curriculum?.modules), options: { chapterTests: hasChapterTests(registeredGrade, grade) } };
}
export function progressVersion(path: string[], progress: Progress) { return path.map((_, i) => progress[path.slice(0, i + 1).join("/")]?.revision || 0).join(":"); }
export type IBQuestion = PracticeQuestion & { points: number; coverage?: string };
export function readActivity(value: unknown, activity: Activity, children: string[]) {
  const data = value as { published?: boolean; title?: string; questions?: IBQuestion[]; criteria?: unknown } | undefined;
  readWorksheet({ ...data, topicId: "ib-mathematics", levelId: 1 });
  const questions = data!.questions!;
  if (questions.some(q => !Number.isFinite(q.points) || q.points <= 0 || q.points > 100)) throw new Error("Configure question marks first.");
  if (activity === "chapter-test") {
    if (!children.length || children.some(id => !questions.some(q => q.coverage === id)) || questions.some(q => !q.coverage || !children.includes(q.coverage))) throw new Error("This test must cover every exercise in its chapter.");
  }
  return { title: data!.title!, questions, criteria: activity.startsWith("worksheet-") ? null : validateCriteria(data!.criteria) };
}
export function requireActivity(modules: ReturnType<typeof curriculumWithPlaceholders>, path: string[], progress: Progress, activity: string, options: { chapterTests: boolean }) {
  const view = curriculumView(modules, path, progress, options);
  const item = view.activities.find(item => item.id === activity);
  if (!item?.available) throw new Error("This activity is locked. Follow the required practice first.");
  return { view, activity: item.id };
}
