export const IB_GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export type CurriculumNode = { id: string; title: string; children: CurriculumNode[] };
export type NodeProgress = {
  completed?: boolean; practiceRequired?: boolean; testAttempted?: boolean; testPassed?: boolean;
  preAttempted?: boolean; prePassed?: boolean; postPassed?: boolean; worksheets?: number[]; revision?: number; activeTestSession?: string;
  preTestPassed?: boolean; pendingPreTestDecision?: boolean; pendingPreTestReportId?: string;
};
export type Activity = "chapter-pre-test" | "chapter-post-test" | "pre-test" | "post-test" | `worksheet-${number}`;
export type Criteria = { minScore: number; minAccuracy: number; maxSeconds: number };
export const IB_PASS_SCORE = 90;
export type Progress = Record<string, NodeProgress>;
export type AccessStatus = "pending" | "approved" | "rejected";
export type CurriculumOptions = { chapterTests: boolean };

const GRADE_SIX_CHAPTER_EIGHT_WAYGROUND_LINKS: Record<string, string> = {
  "algebra/chapter-8/chapter-pre-test": "https://wayground.com/join?gc=53130749",
  "algebra/chapter-8/chapter-post-test": "https://wayground.com/join?gc=59356669",
  "algebra/chapter-8/operations-and-sequences/pre-test": "https://wayground.com/join?gc=40654925",
  "algebra/chapter-8/operations-and-sequences/post-test": "https://wayground.com/join?gc=41539661",
  "algebra/chapter-8/operations-and-sequences/worksheet-1": "https://wayground.com/join?gc=35869785",
  "algebra/chapter-8/operations-and-sequences/worksheet-2": "https://wayground.com/join?gc=64181337",
  "algebra/chapter-8/operations-and-sequences/worksheet-3": "https://wayground.com/join?gc=48976965",
  "algebra/chapter-8/operations-and-sequences/worksheet-4": "https://wayground.com/join?gc=39277657",
  "algebra/chapter-8/multiplication-tables-and-rules/pre-test": "https://wayground.com/join?gc=00132685",
  "algebra/chapter-8/multiplication-tables-and-rules/post-test": "https://wayground.com/join?gc=39368781",
  "algebra/chapter-8/multiplication-tables-and-rules/worksheet-1": "https://wayground.com/join?gc=39844921",
  "algebra/chapter-8/multiplication-tables-and-rules/worksheet-2": "https://wayground.com/join?gc=43123257",
  "algebra/chapter-8/multiplication-tables-and-rules/worksheet-3": "https://wayground.com/join?gc=49873465",
  "algebra/chapter-8/multiplication-tables-and-rules/worksheet-4": "https://wayground.com/join?gc=66257465",
  "algebra/chapter-8/expressions-and-equations/pre-test": "https://wayground.com/join?gc=45201485",
  "algebra/chapter-8/expressions-and-equations/post-test": "https://wayground.com/join?gc=48216141",
  "algebra/chapter-8/expressions-and-equations/worksheet-1": "https://wayground.com/join?gc=34636345",
  "algebra/chapter-8/expressions-and-equations/worksheet-2": "https://wayground.com/join?gc=20349497",
  "algebra/chapter-8/expressions-and-equations/worksheet-3": "https://wayground.com/join?gc=28934713",
};

const GRADE_SIX_WORKSHEETS: Record<string, string[]> = {
  "operations-and-sequences": ["Arithmetic Operations", "Combined Operations", "Number Sequences and Rules", "Figure Sequences and Rules"],
  "multiplication-tables-and-rules": ["Table Multiply Rule", "Table Multiply", "Table Multiply Add/Sub Rule", "Table Multiply Add/Sub"],
  "expressions-and-equations": ["Expression One Value", "Expression Value", "Sentence Equation"],
};
function worksheetTitles(path: string[]) { return GRADE_SIX_WORKSHEETS[path.at(-1) || ""] || []; }

export function externalActivityLink(grade: number, path: string[], activity: Activity): string | null {
  if (grade !== 6 && grade !== 7) return null;
  // Grade 6 and Grade 7 share the prepared Wayground activities while using
  // their own visible module and chapter names.
  const activityPath = ["algebra", "chapter-8", ...path.slice(2), activity];
  return GRADE_SIX_CHAPTER_EIGHT_WAYGROUND_LINKS[activityPath.join("/")] || null;
}

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
const chapterTitles = (topic: string) => Array.from({ length: 7 }, (_, index) => `Chapter ${index + 1}: ${topic}${index ? ` Practice ${index}` : ""}`);
function gradeSixChapters(topic: string, exercises: [string, string, string]): CurriculumNode[] {
  return chapterTitles(topic).map((title, index) => ({
    id: `chapter-${index + 1}`, title, children: [
      { id: "operations-and-sequences", title: exercises[0], children: [] },
      { id: "multiplication-tables-and-rules", title: exercises[1], children: [] },
      { id: "expressions-and-equations", title: exercises[2], children: [] },
    ],
  }));
}
const GRADE_SIX_CURRICULUM: CurriculumNode[] = [
  { id: "algebra", title: "Algebra", children: gradeSixChapters("Operations, Sequences & Equations", ["Operations & Sequences", "Multiplication Tables & Rules", "Expressions & Equations"]) },
  { id: "number-and-operations", title: "Number & Operations", children: gradeSixChapters("Number Skills & Patterns", ["Arithmetic Operations & Patterns", "Multiplication & Division Facts", "Number Sentences & Rules"]) },
  { id: "geometry", title: "Geometry", children: gradeSixChapters("Shape & Space", ["Shapes, Angles & Patterns", "Lines, Symmetry & Transformations", "Geometric Relationships"]) },
  { id: "measurement", title: "Measurement", children: gradeSixChapters("Length, Area & Volume", ["Units & Conversions", "Perimeter & Area", "Volume & Capacity"]) },
];

export function curriculumWithPlaceholders(value: unknown, grade?: number): CurriculumNode[] {
  const configured = parseCurriculum(value ?? []);
  // Earlier Grade 6 documents stored only the old Chapter 8. Replace that
  // legacy chapter with the standard Chapter 1–7 set while preserving any
  // configured chapters that use the new numbering. Grade 7 uses the same
  // prepared module and chapter structure.
  const curriculum = grade === 6 || grade === 7
    ? [...GRADE_SIX_CURRICULUM.map(defaultModule => {
      const configuredModule = configured.find(module => module.id === defaultModule.id);
      const configuredChapters = configuredModule?.children.filter(chapter => /^chapter-[1-7]$/.test(chapter.id)) || [];
      if (!configuredModule || !configuredChapters.length) return defaultModule;
      return {
        ...configuredModule,
        children: defaultModule.children.map(chapter => configuredChapters.find(item => item.id === chapter.id) || chapter)
          .concat(configuredModule.children.filter(chapter => !/^chapter-[1-8]$/.test(chapter.id) && !defaultModule.children.some(item => item.id === chapter.id))),
      };
    }), ...configured.filter(module => !GRADE_SIX_CURRICULUM.some(defaultModule => defaultModule.id === module.id))]
    : configured;
  function fill(nodes: CurriculumNode[], depth: number): CurriculumNode[] {
    const { label, count } = PLACEHOLDER_LEVELS[depth];
    const cards = nodes.length ? nodes : Array.from({ length: count }, (_, index) => ({
      id: `${label.toLowerCase()}-${index + 1}`, title: `${label} ${index + 1}`, children: [],
    }));
    return cards.map(node => ({ ...node, children: depth === 2 ? [] : fill(node.children, depth + 1) }));
  }
  return fill(curriculum, 0);
}

export function migrateLegacyGradeSixProgress(progress: Progress): { progress: Progress; migrated: boolean } {
  const migrated = structuredClone(progress);
  let changed = false;
  for (const [key, state] of Object.entries(progress)) {
    if (!/\/chapter-8(?:\/|$)/.test(key)) continue;
    const replacement = key.replace(/\/chapter-8(?=\/|$)/, "/chapter-1");
    if (!(replacement in migrated)) migrated[replacement] = state;
    delete migrated[key];
    changed = true;
  }
  return { progress: changed ? migrated : progress, migrated: changed };
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
      if (!chapterPassed && !chapterState.testAttempted) throw new Error("Take the chapter pre-test first.");
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
    const exercisesComplete = children.length > 0 && children.every(child => child.completed);
    activities.push({ id: "chapter-pre-test", title: "Chapter pre-test", available: !state.testAttempted, complete: state.testAttempted === true,
      reason: state.testAttempted ? "Completed · finish every exercise to unlock the chapter post-test" : "Complete this before starting the exercises" });
    activities.push({ id: "chapter-post-test", title: "Chapter post-test", available: state.testAttempted === true && exercisesComplete && !chapterPassed, complete: chapterPassed,
      reason: chapterPassed ? "Passed · this chapter is complete" : !state.testAttempted ? "Complete the chapter pre-test first" : exercisesComplete ? "Ready to assess your chapter learning" : "Complete every exercise to unlock this test" });
  }
  if (depth === 3) {
    const complete = chapterPassed || isComplete(current!, path, 2, progress, options);
    activities.push({ id: "pre-test", title: "Exercise pre-test", available: !state.preAttempted, complete: state.prePassed === true,
      reason: complete ? "Optional practice · this exercise is already cleared" : state.preAttempted ? "Complete the worksheets, then the post-test" : "Meet this test’s score, accuracy and time targets to clear the exercise" });
    const titles = worksheetTitles(path);
    const worksheetTotal = titles.length || 10;
    for (let i = 1; i <= worksheetTotal; i++) activities.push({ id: `worksheet-${i}`, title: titles[i - 1] || `Worksheet ${i}`, available: complete || state.preAttempted === true, complete: state.worksheets?.includes(i) === true, reason: complete ? "Optional practice" : state.preAttempted ? "Required practice before the post-test" : "Take the exercise pre-test first" });
    const practiced = Array.from({ length: worksheetTotal }, (_, i) => i + 1).every(i => state.worksheets?.includes(i));
    activities.push({ id: "post-test", title: "Exercise post-test", available: (practiced || chapterPassed) && state.postPassed !== true, complete: state.postPassed === true, reason: state.postPassed ? "Passed · this exercise is complete" : chapterPassed ? "Optional assessment · the chapter is already passed" : practiced ? "Ready to assess your progress" : `Complete all ${worksheetTotal} worksheets in this practice round first` });
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
  if (activity === "chapter-pre-test") {
    state.testAttempted = true; state.testPassed = false;
  } else if (activity === "chapter-post-test") {
    state.testAttempted = true; state.testPassed = passed;
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
