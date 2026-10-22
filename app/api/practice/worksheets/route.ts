import { requireLearner } from "@/lib/server/practice";
import { readWorksheet } from "@/lib/practice/worksheet";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const { db } = await requireLearner(request);
    const docs = await db.collection("practiceWorksheets").where("published", "==", true).limit(100).get();
    const worksheets = docs.docs.flatMap(doc => {
      try { const worksheet = readWorksheet(doc.data()); if (worksheet.topicId === "ib-mathematics") return []; return [{ id: doc.id, title: worksheet.title, topicId: worksheet.topicId, levelId: worksheet.levelId, questionCount: worksheet.questions.length }]; }
      catch { return []; }
    });
    return Response.json({ worksheets }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Unable to load worksheets. Please try again." }, { status: 403 }); }
}
