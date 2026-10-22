export type PracticeQuestion = { id: string; prompt: string; answer: string };
export type PublishedWorksheet = { title: string; topicId: string; levelId: number; published: true; questions: PracticeQuestion[] };
export function readWorksheet(value: unknown): PublishedWorksheet {
  const data = value as PublishedWorksheet | undefined;
  if (!data || data.published !== true || typeof data.title !== "string" || !data.title.trim() || typeof data.topicId !== "string" || !/^[a-z0-9-]+$/.test(data.topicId) || !Number.isInteger(data.levelId) || data.levelId < 1 || !Array.isArray(data.questions) || data.questions.length < 1 || data.questions.length > 100) throw new Error("This worksheet is not available yet.");
  const ids = new Set<string>();
  for (const question of data.questions) {
    if (!question || typeof question.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(question.id) || ids.has(question.id) || typeof question.prompt !== "string" || !question.prompt.trim() || typeof question.answer !== "string" || !question.answer.trim()) throw new Error("This worksheet needs an admin review.");
    ids.add(question.id);
  }
  return data;
}
function normalize(answer: string) {
  const text = answer.trim().toLowerCase().replace(/\s+/g, " ");
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? String(Number(text)) : text;
}
export function gradeWorksheet(questions: PracticeQuestion[], answers: unknown) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new Error("Answer every question before submitting.");
  const values = answers as Record<string, unknown>;
  if (Object.keys(values).length !== questions.length) throw new Error("Answer every question before submitting.");
  let correct = 0;
  const submitted: Record<string, string> = {};
  for (const question of questions) {
    const answer = values[question.id];
    if (typeof answer !== "string" || !answer.trim() || answer.length > 200) throw new Error("Answer every question before submitting (maximum 200 characters each).");
    submitted[question.id] = answer.trim();
    if (normalize(answer) === normalize(question.answer)) correct++;
  }
  return { correct, total: questions.length, accuracy: Math.round(correct / questions.length * 100), answers: submitted };
}
