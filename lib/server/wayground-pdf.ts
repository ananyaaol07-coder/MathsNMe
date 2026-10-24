import PDFDocument from "pdfkit";
import { PassThrough } from "node:stream";
import path from "node:path";
import type { WaygroundReportInput } from "@/lib/reports/wayground";

type PdfReport = WaygroundReportInput & { studentName: string; completedDate: string };
type Pdf = InstanceType<typeof PDFDocument>;
const C = { navy: "#111827", ink: "#172033", muted: "#64748B", gold: "#F4C542", line: "#E7DEC4", green: "#22C55E", red: "#EF4444", greenBg: "#EAFBF0", blue: "#3B82F6", blueBg: "#EAF2FF", purple: "#8B5CF6", purpleBg: "#F1EAFF", cream: "#FFF9EA", pale: "#F8FAFC" };

function text(doc: Pdf, value: string, x: number, y: number, size = 10, color = C.ink, bold = false, width?: number) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color).text(value, x, y, width ? { width } : {});
}
function center(doc: Pdf, value: string, x: number, y: number, size = 10, color = C.ink, bold = false, width = 120) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(color).text(value, x - width / 2, y, { width, align: "center" });
}
function rr(doc: Pdf, x: number, y: number, w: number, h: number, color: string, border?: string) { doc.roundedRect(x, y, w, h, 14).fillAndStroke(color, border || color); }
function header(doc: Pdf, label: string) {
  doc.rect(0, 0, 595, 54).fill(C.navy);
  doc.image(path.join(process.cwd(), "public/maths-n-me-logo-full.png"), 40, 12, { fit: [145, 34] });
  text(doc, label.toUpperCase(), 430, 23, 8, "#D8E0EE", true);
}
function footer(doc: Pdf, page: number) { doc.moveTo(40, 807).lineTo(555, 807).strokeColor(C.line).stroke(); text(doc, "Maths n Me  •  Transforming Student to Scholar", 40, 815, 7, C.muted); text(doc, `Page ${page}`, 515, 815, 7, C.muted); }
function metric(doc: Pdf, x: number, y: number, bg: string, color: string, letter: string, value: string, label: string) { rr(doc, x, y, 118, 92, bg); doc.circle(x + 18, y + 18, 7).fill(color); text(doc, letter, x + 15.5, y + 14, 7, "#ffffff", true); text(doc, value, x + 12, y + 40, 19, C.ink, true); text(doc, label.toUpperCase(), x + 12, y + 69, 6.5, C.muted, true); }

export async function createWaygroundPdf(report: PdfReport) {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true, info: { Title: "Maths n Me Achievement Report", Author: "Maths n Me" } });
  const stream = new PassThrough(), parts: Buffer[] = [];
  stream.on("data", part => parts.push(Buffer.from(part)));
  const completed = new Promise<Buffer>((resolve, reject) => { stream.on("end", () => resolve(Buffer.concat(parts))); stream.on("error", reject); });
  doc.pipe(stream);
  const passed = report.accuracy >= 90;
  const storedActivity = report.learningPath?.activityTitle;
  const title = storedActivity && !/not set/i.test(storedActivity) ? storedActivity : report.quizTitle && !/^summary$/i.test(report.quizTitle) ? report.quizTitle : "Assessment";
  const firstName = report.studentName.trim().split(/\s+/)[0] || "STUDENT";
  header(doc, "Achievement report");
  rr(doc, 40, 74, 515, 158, C.cream, C.gold);
  text(doc, `AMAZING WORK, ${firstName.toUpperCase()}!`, 62, 104, 22, C.ink, true);
  text(doc, report.accuracy === 100 ? "A perfect result!" : passed ? "You cleared the 90% goal!" : "Keep practising — you are improving.", 62, 145, 13, passed ? "#15803D" : "#8A6500", true);
  text(doc, `${title}  •  Completed ${report.completedDate}`, 62, 181, 9, C.muted);
  const badgeX = 468;
  doc.lineWidth(11).circle(badgeX, 151, 50).strokeColor(passed ? C.green : C.gold).stroke(); doc.circle(badgeX, 151, 38).fill("#ffffff");
  center(doc, `${report.accuracy}%`, badgeX, 130, 25, C.ink, true, 94); center(doc, "ACCURACY", badgeX, 165, 7.5, C.muted, true, 94); rr(doc, badgeX - 38, 187, 76, 19, passed ? C.green : C.gold); center(doc, passed ? "PASSED" : "KEEP GOING", badgeX, 193, 7.5, "#ffffff", true, 70);
  text(doc, "Your performance at a glance", 40, 262, 15, C.ink, true);
  metric(doc, 40, 294, C.greenBg, C.green, "A", `${report.correct} / ${report.total}`, "Correct answers");
  metric(doc, 172, 294, C.blueBg, C.blue, "S", report.averageSeconds === null ? "—" : `${report.averageSeconds} sec`, "Average speed");
  metric(doc, 304, 294, C.purpleBg, C.purple, "C", report.bestStreak === null ? "—" : String(report.bestStreak), "Best streak");
  metric(doc, 436, 294, C.cream, C.gold, "P", report.score === null ? "—" : report.score.toLocaleString(), "Wayground score");
  text(doc, `Your ${report.total}-question journey`, 40, 420, 15, C.ink, true); rr(doc, 40, 450, 515, 114, C.pale, C.line);
  const shown = Math.min(report.total, 30);
  for (let index = 0; index < shown; index++) {
    const question = report.questions[index], row = Math.floor(index / 10), column = index % 10;
    const countInRow = Math.min(10, shown - row * 10), x = (595 - (countInRow - 1) * 47) / 2 + column * 47, y = 488 + row * 34;
    const correct = question?.correct ?? index < report.correct;
    doc.circle(x, y, 13).fill(correct ? C.green : C.red); center(doc, String(index + 1), x, y - 4, 7, "#ffffff", true, 18);
  }
  text(doc, passed ? "Every green circle is a correct answer — great work!" : "Review the red circles, then try again.", 165, 535, 8, passed ? "#15803D" : "#8A6500", true);
  text(doc, "What your result tells us", 40, 595, 15, C.ink, true);
  rr(doc, 40, 626, 247, 92, C.greenBg); text(doc, passed ? "Strong accuracy" : "A clear next step", 58, 650, 11, C.ink, true); text(doc, `You answered ${report.correct} of ${report.total} questions correctly${passed ? " and cleared the 90% goal." : "."}`, 58, 681, 8.5, C.muted, false, 210);
  rr(doc, 308, 626, 247, 92, C.blueBg); text(doc, report.averageSeconds === null ? "Keep building speed" : "Quick thinking", 326, 650, 11, C.ink, true); text(doc, report.averageSeconds === null ? "Wayground did not provide a timing average for this activity." : `An average of ${report.averageSeconds} seconds shows your current solving pace.`, 326, 681, 8.5, C.muted, false, 210);
  rr(doc, 40, 744, 515, 48, C.navy); text(doc, "NEXT ADVENTURE", 58, 757, 7, C.gold, true); text(doc, passed ? "You are ready to move to the next exercise!" : "Review this exercise, then try the test again.", 58, 772, 13, "#ffffff", true); footer(doc, 1);
  const questions = report.questions;
  for (let start = 0, page = 2; start < questions.length; start += 6, page++) { doc.addPage(); header(doc, "Question review"); text(doc, "See how you solved it", 40, 86, 21, C.ink, true); text(doc, "Your answers and the correct answers from Wayground.", 40, 116, 9, C.muted); questions.slice(start, start + 6).forEach((question, offset) => { const y = 148 + offset * 101, correct = question.correct; rr(doc, 40, y, 515, 82, "#ffffff", C.line); doc.circle(65, y + 41, 14).fill(correct ? C.green : C.red); text(doc, String(question.number), 61, y + 36, 8.5, "#ffffff", true); text(doc, question.prompt, 90, y + 15, 9, C.ink, true, 430); text(doc, "Your answer", 90, y + 50, 6.5, C.muted, true); text(doc, question.studentAnswer, 90, y + 61, 8.5, correct ? "#15803D" : C.ink, true, 115); text(doc, "Correct answer", 240, y + 50, 6.5, C.muted, true); text(doc, question.correctAnswer, 240, y + 61, 8.5, C.ink, true, 115); text(doc, "Time", 410, y + 50, 6.5, C.muted, true); text(doc, question.timeSeconds === null ? "—" : `${question.timeSeconds} sec`, 410, y + 61, 8.5, C.ink, true); }); footer(doc, page); }
  doc.end(); return completed;
}
