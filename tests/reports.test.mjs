import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../lib/reports/wayground.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const compiled = { exports: {} }; vm.runInNewContext(js, { module: compiled, exports: compiled.exports, Date, Error });
const { readWaygroundReport } = compiled.exports;

test("validates a captured Wayground report", () => {
  const result = readWaygroundReport({ source: "wayground-extension", quizTitle: "Addition", capturedAt: Date.now(), accuracy: 100, score: 15900, correct: 20, incorrect: 0, total: 20, averageSeconds: 3, bestStreak: 20, questions: [], sourceUrl: "https://wayground.com/result" });
  assert.equal(result.correct, 20); assert.equal(result.accuracy, 100); assert.equal(result.quizTitle, "Addition");
});

test("rejects impossible report totals", () => {
  assert.throws(() => readWaygroundReport({ source: "wayground-extension", capturedAt: Date.now(), accuracy: 100, correct: 21, incorrect: 0, total: 20, questions: [] }));
});
