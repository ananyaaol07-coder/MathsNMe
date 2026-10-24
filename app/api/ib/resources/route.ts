import { ibContext } from "@/lib/server/ib-activities";
import { requireLearner } from "@/lib/server/practice";

function resourceId(grade: number, path: string[]) { return `${grade}_${path.join("_")}`; }

export async function GET(request: Request) {
  try {
    const { db, uid, profile } = await requireLearner(request);
    const url = new URL(request.url), grade = Number(url.searchParams.get("grade"));
    const path = (url.searchParams.get("path") || "").split("/").filter(Boolean);
    await ibContext(db, uid, Number(profile.grade), grade, path);
    if (path.length !== 3) throw new Error("Choose an exercise first.");
    const data = (await db.doc(`ibExerciseResources/${resourceId(grade, path)}`).get()).data() || {};
    return Response.json({ notes: typeof data.notes === "string" ? data.notes : "", notesUrl: typeof data.notesUrl === "string" ? data.notesUrl : "", videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load exercise resources." }, { status: 400 }); }
}
