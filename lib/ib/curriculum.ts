export const IB_GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export type CurriculumNode = { id: string; title: string; children: CurriculumNode[] };
export type TopicProgress = {
  completed?: boolean; practiceRequired?: boolean; testAttempted?: boolean; testPassed?: boolean;
  preAttempted?: boolean; prePassed?: boolean; postPassed?: boolean; worksheets?: number[]; revision?: number; activeTestSession?: string;
};
export type Activity = "chapter-test" | "exercise-test" | "pre-test" | "post-test" | `worksheet-${number}`;
export type Criteria = { minScore: number; minAccuracy: number; maxSeconds: number };
export function validateCriteria(value: unknown): Criteria {
  const c = value as Criteria | undefined;
  if (!c || !Number.isFinite(c.minScore) || c.minScore < 0 || c.minScore > 100 || !Number.isFinite(c.minAccuracy) || c.minAccuracy < 0 || c.minAccuracy > 100 || !Number.isFinite(c.maxSeconds) || c.maxSeconds <= 0) throw new Error("Configure this test’s score, accuracy and time criteria first.");
  return { minScore: c.minScore, minAccuracy: c.minAccuracy, maxSeconds: c.maxSeconds };
}
export function passesTest(criteria: Criteria, score: number, accuracy: number, seconds: number) {
  return [score, accuracy, seconds].every(Number.isFinite) && seconds >= 0 && score >= criteria.minScore && accuracy >= criteria.minAccuracy && seconds <= criteria.maxSeconds;
}
export type Progress = Record<string, TopicProgress>;
export type AccessStatus = "pending" | "approved" | "rejected";
export function validGrade(value: unknown): value is number { return typeof value === "number" && IB_GRADES.includes(value); }
export function canAccessGrade(registeredGrade: number, grade: number, approval?: string) {
  return validGrade(grade) && (registeredGrade === grade || approval === "approved");
}
// Each grade's ordered tree is configured independently; no invented syllabus.
export function parseCurriculum(value: unknown): CurriculumNode[] {
  let count = 0;
  function parse(nodes: unknown, depth: number): CurriculumNode[] {
    if (!Array.isArray(nodes) || nodes.length > 100) throw new Error("Invalid IB curriculum.");
    const ids = new Set<string>();
    return nodes.map(node => {
      if (++count > 4000 || !node || typeof node !== "object") throw new Error("Invalid IB curriculum.");
      const { id, title, children } = node as CurriculumNode;
      if (typeof id !== "string" || !/^[a-z0-9-]{1,60}$/.test(id) || ids.has(id) || typeof title !== "string" || !title.trim() || title.length > 200) throw new Error("Invalid IB curriculum.");
      ids.add(id);
      if (depth === 3 && (!Array.isArray(children) || children.length)) throw new Error("Topics cannot have nested curriculum nodes.");
      return { id, title, children: depth === 3 ? [] : parse(children, depth + 1) };
    });
  }
  return parse(value, 0);
}
// Temporary numbered cards. Stable IDs let titles change without losing progress.
const PLACEHOLDER_LEVELS = [
  { label: "Module", count: 3 },
  { label: "Chapter", count: 6 },
  { label: "Exercise", count: 3 },
  { label: "Topic", count: 3 },
];
export function curriculumWithPlaceholders(value: unknown): CurriculumNode[] {
  const configured = parseCurriculum(value ?? []);
  function fill(nodes: CurriculumNode[], depth: number): CurriculumNode[] {
    const { label, count } = PLACEHOLDER_LEVELS[depth];
    const cards = nodes.length ? nodes : Array.from({ length: count }, (_, index) => ({
      id: `${label.toLowerCase()}-${index + 1}`, title: `${label} ${index + 1}`, children: [],
    }));
    return cards.map(node => ({ ...node, children: depth === 3 ? [] : fill(node.children, depth + 1) }));
  }
  return fill(configured, 0);
}
export function isComplete(node: CurriculumNode, path: string[], depth: number, progress: Progress): boolean {
  const state = progress[path.join("/")] || {};
  if (depth === 1 || depth === 2) return state.testPassed === true;
  if (depth === 3) return (state.prePassed === true || state.postPassed === true) && state.practiceRequired !== true;
  return node.children.length > 0 && node.children.every(child => isComplete(child, [...path, child.id], depth + 1, progress));
}
export function curriculumView(modules: CurriculumNode[], path: string[], progress: Progress) {
  if (path.length > 4) throw new Error("Page not found.");
  let siblings = modules;
  const breadcrumbs: { id: string; title: string }[] = [];
  let current: CurriculumNode | undefined;
  let inheritedPass = false;
  for (let depth = 0; depth < path.length; depth++) {
    const index = siblings.findIndex(node => node.id === path[depth]);
    if (index < 0) throw new Error("Page not found.");
    if (depth >= 2 && !inheritedPass) {
      const parent = progress[path.slice(0, depth).join("/")] || {};
      if (!parent.testAttempted) throw new Error("Take the parent test first.");
    }
    if (depth > 0 && !inheritedPass && !siblings.slice(0, index).every(node => isComplete(node, [...path.slice(0, depth), node.id], depth, progress))) throw new Error("Pass the previous item to unlock this page.");
    current = siblings[index];
    breadcrumbs.push({ id: current.id, title: current.title });
    if ((depth === 1 || depth === 2) && progress[path.slice(0, depth + 1).join("/")]?.testPassed) inheritedPass = true;
    siblings = current.children;
  }
  const depth = path.length, state = progress[path.join("/")] || {};
  const childrenReady = inheritedPass || depth < 2 || state.testAttempted === true;
  const children = siblings.map((node, index) => ({ id: node.id, title: node.title,
    completed: inheritedPass || isComplete(node, [...path, node.id], depth, progress),
    unlocked: childrenReady && (depth === 0 || inheritedPass || siblings.slice(0, index).every(previous => isComplete(previous, [...path, previous.id], depth, progress))),
  }));
  const activities: { id: Activity; title: string; available: boolean; complete: boolean; reason: string }[] = [];
  if (depth === 2 || depth === 3) {
    const title = depth === 2 ? "Chapter test" : "Exercise test";
    const ready = !inheritedPass && (!state.testAttempted || (children.length > 0 && children.every(child => child.completed)));
    activities.push({ id: depth === 2 ? "chapter-test" : "exercise-test", title, available: ready, complete: inheritedPass,
      reason: inheritedPass ? "Passed · optional practice is available below" : ready ? "Pass to move on without required practice" : `Complete the ${depth === 2 ? "exercises" : "topics"} below before trying again` });
  }
  if (depth === 4) {
    const complete = inheritedPass || isComplete(current!, path, 3, progress);
    activities.push({ id: "pre-test", title: "Topic pre-test", available: !complete && !state.preAttempted, complete: state.prePassed === true,
      reason: complete ? "Topic cleared · worksheets are optional" : state.preAttempted ? "Complete the worksheets, then the post-test" : "Meet this test’s score, accuracy and time targets to skip required practice" });
    for (let i = 1; i <= 10; i++) activities.push({ id: `worksheet-${i}`, title: `Worksheet ${i}`, available: complete || state.preAttempted === true, complete: state.worksheets?.includes(i) === true, reason: complete ? "Optional practice" : state.preAttempted ? "Required practice before the post-test" : "Take the topic pre-test first" });
    const practiced = Array.from({ length: 10 }, (_, i) => i + 1).every(i => state.worksheets?.includes(i));
    activities.push({ id: "post-test", title: "Topic post-test", available: !complete && practiced, complete: state.postPassed === true, reason: complete ? "Topic cleared" : practiced ? "Ready to assess your progress" : "Complete all 10 worksheets in this practice round first" });
  }
  return { breadcrumbs, children, activities,
    topic: depth === 4 ? { title: current!.title, practiceRequired: !inheritedPass && state.practiceRequired === true, completed: inheritedPass || isComplete(current!, path, 3, progress) } : null };
}
// Only call after server-side grading. Test failure starts a fresh remediation
// round; immutable attempt records retain the history outside this current state.
export function applyActivity(modules: CurriculumNode[], path: string[], progress: Progress, activity: Activity, passed: boolean): Progress {
  const view = curriculumView(modules, path, progress);
  if (!view.activities.find(item => item.id === activity)?.available) throw new Error("This activity is locked.");
  const result = structuredClone(progress), key = path.join("/"), state = { ...(result[key] || {}) };
  state.revision = (state.revision || 0) + 1;
  if (!activity.startsWith("worksheet-")) delete state.activeTestSession;
  if (activity === "chapter-test" || activity === "exercise-test") {
    state.testAttempted = true; state.testPassed = passed;
    if (!passed) for (const existing of Object.keys(result)) if (existing.startsWith(key + "/")) delete result[existing];
  } else if (activity === "pre-test") {
    state.preAttempted = true; state.prePassed = passed; state.practiceRequired = !passed; state.worksheets = [];
  } else if (activity === "post-test") {
    state.postPassed = passed; state.practiceRequired = !passed;
    if (!passed) state.worksheets = [];
  } else {
    const index = Number(activity.slice("worksheet-".length));
    state.worksheets = [...new Set([...(state.worksheets || []), index])];
  }
  result[key] = state;
  return result;
}
