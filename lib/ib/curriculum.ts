export const IB_GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export type CurriculumNode = { id: string; title: string; children: CurriculumNode[] };
export type NodeProgress = {
  completed?: boolean; practiceRequired?: boolean; testAttempted?: boolean; testPassed?: boolean;
  preAttempted?: boolean; prePassed?: boolean; postPassed?: boolean; worksheets?: number[]; revision?: number; activeTestSession?: string;
};
export type Activity = "chapter-test" | "pre-test" | "post-test" | `worksheet-${number}`;
export type Criteria = { minScore: number; minAccuracy: number; maxSeconds: number };
export const IB_PASS_SCORE = 90;
export type Progress = Record<string, NodeProgress>;
export type AccessStatus = "pending" | "approved" | "rejected";
export type CurriculumOptions = { chapterTests: boolean };

export function validateCriteria(value: unknown): Criteria {
  const c = value as Criteria | undefined;
  if (!c || !Number.isFinite(c.minAccuracy) || c.minAccuracy < 0 || c.minAccuracy > 100 || !Number.isFinite(c.maxSeconds) || c.maxSeconds <= 0) throw new Error("Configure this test’s accuracy and time criteria first.");
  return { minScore: IB_PASS_SCORE, minAccuracy: c.minAccuracy, maxSeconds: c.maxSeconds };
}
export function passesTest(criteria: Criteria, score: number, accuracy: number, seconds: number) {
  return [score, accuracy, seconds].every(Number.isFinite) && seconds >= 0 && score >= criteria.minScore && accuracy >= criteria.minAccuracy && seconds <= criteria.maxSeconds;
}
export function validGrade(value: unknown): value is number { return typeof value === "number" && IB_GRADES.includes(value); }
export function isAutomaticGrade(registeredGrade: number, grade: number) {
  return validGrade(grade) && (grade === registeredGrade || grade === registeredGrade - 1);
}
export function canAccessGrade(registeredGrade: number, grade: number, approval?: string) {
  return validGrade(grade) && (isAutomaticGrade(registeredGrade, grade) || approval === "approved");
}
export function hasChapterTests(registeredGrade: number, grade: number) {
  return grade === registeredGrade - 1 && validGrade(grade);
}

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
      if (depth === 2 && (!Array.isArray(children) || children.length)) throw new Error("Exercises cannot have nested curriculum nodes.");
      return { id, title, children: depth === 2 ? [] : parse(children, depth + 1) };
    });
  }
  return parse(value, 0);
}

const PLACEHOLDER_LEVELS = [
  { label: "Module", count: 3 },
  { label: "Chapter", count: 6 },
  { label: "Exercise", count: 3 },
];
export function curriculumWithPlaceholders(value: unknown): CurriculumNode[] {
  const configured = parseCurriculum(value ?? []);
  function fill(nodes: CurriculumNode[], depth: number): CurriculumNode[] {
    const { label, count } = PLACEHOLDER_LEVELS[depth];
    const cards = nodes.length ? nodes : Array.from({ length: count }, (_, index) => ({
      id: `${label.toLowerCase()}-${index + 1}`, title: `${label} ${index + 1}`, children: [],
    }));
    return cards.map(node => ({ ...node, children: depth === 2 ? [] : fill(node.children, depth + 1) }));
  }
  return fill(configured, 0);
}

export function isComplete(node: CurriculumNode, path: string[], depth: number, progress: Progress, options: CurriculumOptions): boolean {
  const state = progress[path.join("/")] || {};
  if (depth === 2) return (state.prePassed === true || state.postPassed === true) && state.practiceRequired !== true;
  if (depth === 1 && options.chapterTests) return state.testPassed === true;
  return node.children.length > 0 && node.children.every(child => isComplete(child, [...path, child.id], depth + 1, progress, options));
}

export function curriculumView(modules: CurriculumNode[], path: string[], progress: Progress, options: CurriculumOptions) {
  if (path.length > 3) throw new Error("Page not found.");
  let siblings = modules;
  const breadcrumbs: { id: string; title: string }[] = [];
  let current: CurriculumNode | undefined;
  let chapterPassed = false;
  for (let depth = 0; depth < path.length; depth++) {
    const index = siblings.findIndex(node => node.id === path[depth]);
    if (index < 0) throw new Error("Page not found.");
    if (depth === 2 && options.chapterTests) {
      const chapterState = progress[path.slice(0, 2).join("/")] || {};
      chapterPassed = chapterState.testPassed === true;
      if (!chapterPassed && !chapterState.testAttempted) throw new Error("Take the chapter test first.");
    }
    if (depth > 0 && !chapterPassed && !siblings.slice(0, index).every(node => isComplete(node, [...path.slice(0, depth), node.id], depth, progress, options))) throw new Error("Pass the previous item to unlock this page.");
    current = siblings[index];
    breadcrumbs.push({ id: current.id, title: current.title });
    siblings = current.children;
  }
  const depth = path.length;
  const state = progress[path.join("/")] || {};
  if (depth >= 2 && options.chapterTests) chapterPassed = progress[path.slice(0, 2).join("/")]?.testPassed === true;
  const childrenReady = depth !== 2 || chapterPassed || !options.chapterTests || state.testAttempted === true;
  const children = siblings.map((node, index) => ({
    id: node.id, title: node.title,
    completed: chapterPassed || isComplete(node, [...path, node.id], depth, progress, options),
    unlocked: childrenReady && (depth === 0 || chapterPassed || siblings.slice(0, index).every(previous => isComplete(previous, [...path, previous.id], depth, progress, options))),
  }));
  const activities: { id: Activity; title: string; available: boolean; complete: boolean; reason: string }[] = [];
  if (depth === 2 && options.chapterTests) {
    const ready = !chapterPassed && (!state.testAttempted || (children.length > 0 && children.every(child => child.completed)));
    activities.push({ id: "chapter-test", title: "Chapter test", available: ready, complete: chapterPassed,
      reason: chapterPassed ? "Passed · the exercises remain available for optional practice" : ready ? "Pass to clear this chapter" : "Complete every exercise below before trying again" });
  }
  if (depth === 3) {
    const complete = chapterPassed || isComplete(current!, path, 2, progress, options);
    activities.push({ id: "pre-test", title: "Exercise pre-test", available: !complete && !state.preAttempted, complete: state.prePassed === true,
      reason: complete ? "Exercise cleared · worksheets remain optional" : state.preAttempted ? "Complete the worksheets, then the post-test" : "Meet this test’s score, accuracy and time targets to clear the exercise" });
    for (let i = 1; i <= 10; i++) activities.push({ id: `worksheet-${i}`, title: `Worksheet ${i}`, available: complete || state.preAttempted === true, complete: state.worksheets?.includes(i) === true, reason: complete ? "Optional practice" : state.preAttempted ? "Required practice before the post-test" : "Take the exercise pre-test first" });
    const practiced = Array.from({ length: 10 }, (_, i) => i + 1).every(i => state.worksheets?.includes(i));
    activities.push({ id: "post-test", title: "Exercise post-test", available: !complete && practiced, complete: state.postPassed === true, reason: complete ? "Exercise cleared" : practiced ? "Ready to assess your progress" : "Complete all 10 worksheets in this practice round first" });
  }
  return { breadcrumbs, children, activities,
    exercise: depth === 3 ? { title: current!.title, practiceRequired: !chapterPassed && state.practiceRequired === true, completed: chapterPassed || isComplete(current!, path, 2, progress, options) } : null };
}

export function applyActivity(modules: CurriculumNode[], path: string[], progress: Progress, activity: Activity, passed: boolean, options: CurriculumOptions): Progress {
  const view = curriculumView(modules, path, progress, options);
  if (!view.activities.find(item => item.id === activity)?.available) throw new Error("This activity is locked.");
  const result = structuredClone(progress), key = path.join("/"), state = { ...(result[key] || {}) };
  state.revision = (state.revision || 0) + 1;
  if (!activity.startsWith("worksheet-")) delete state.activeTestSession;
  if (activity === "chapter-test") {
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
