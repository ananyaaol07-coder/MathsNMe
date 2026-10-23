export type WaygroundQuestion = {
  number: number;
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  correct: boolean;
  timeSeconds: number | null;
};

export type WaygroundReportInput = {
  source: "wayground-extension";
  quizTitle: string;
  capturedAt: number;
  accuracy: number;
  score: number | null;
  correct: number;
  incorrect: number;
  total: number;
  averageSeconds: number | null;
  bestStreak: number | null;
  questions: WaygroundQuestion[];
  sourceUrl: string;
};

function numberIn(value: unknown, min: number, max: number, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error("The Wayground result contains an invalid number.");
  return value;
}

function shortText(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback;
  const clean = value.replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : fallback;
}

export function readWaygroundReport(value: unknown): WaygroundReportInput {
  if (!value || typeof value !== "object") throw new Error("The Wayground result is missing.");
  const data = value as Record<string, unknown>;
  if (data.source !== "wayground-extension") throw new Error("This result did not come from the Maths n Me extension.");
  const total = Math.round(numberIn(data.total, 1, 500) as number);
  const correct = Math.round(numberIn(data.correct, 0, total) as number);
  const incorrect = Math.round(numberIn(data.incorrect, 0, total) as number);
  const rawQuestions = Array.isArray(data.questions) ? data.questions.slice(0, 100) : [];
  return {
    source: "wayground-extension",
    quizTitle: shortText(data.quizTitle, "Wayground assessment", 180),
    capturedAt: Math.round(numberIn(data.capturedAt, 1, Date.now() + 5 * 60_000) as number),
    accuracy: Math.round(numberIn(data.accuracy, 0, 100) as number),
    score: numberIn(data.score, 0, 100_000_000, true),
    correct,
    incorrect,
    total,
    averageSeconds: numberIn(data.averageSeconds, 0, 86_400, true),
    bestStreak: numberIn(data.bestStreak, 0, 10_000, true),
    questions: rawQuestions.map((item, index) => {
      const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        number: Math.round(numberIn(row.number ?? index + 1, 1, 500) as number),
        prompt: shortText(row.prompt, `Question ${index + 1}`, 500),
        studentAnswer: shortText(row.studentAnswer, "Not available", 300),
        correctAnswer: shortText(row.correctAnswer, "Not available", 300),
        correct: row.correct === true,
        timeSeconds: numberIn(row.timeSeconds, 0, 86_400, true),
      };
    }),
    sourceUrl: shortText(data.sourceUrl, "https://wayground.com", 1000),
  };
}
