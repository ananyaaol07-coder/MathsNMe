import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin, serverDb } from "@/lib/server/firebase";

function read(body: unknown) {
  const value = body as Record<string, unknown>, grade = Number(value.grade), path = value.path;
  if (!Number.isInteger(grade) || grade < 3 || grade > 12 || !Array.isArray(path) || path.length !== 3 || path.some(item => typeof item !== "string" || !/^[a-z0-9-]{1,60}$/.test(item))) throw new Error("Choose a valid grade, module, chapter, and exercise.");
  const text = (key: "notes" | "notesUrl" | "videoUrl") => typeof value[key] === "string" ? value[key].trim() : "";
  const notes = text("notes"), notesUrl = text("notesUrl"), videoUrl = text("videoUrl");
  if (notes.length > 5000) throw new Error("Notes must be 5,000 characters or fewer.");
  for (const link of [notesUrl, videoUrl]) if (link && !/^https:\/\//.test(link)) throw new Error("Resource links must start with https://.");
  return { grade, path, notes, notesUrl, videoUrl };
}
function id(grade: number, path: string[]) { return `${grade}_${path.join("_")}`; }
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url), resource = read({ grade: url.searchParams.get("grade"), path: (url.searchParams.get("path") || "").split("/").filter(Boolean) });
    const data = (await serverDb().doc(`ibExerciseResources/${id(resource.grade, resource.path)}`).get()).data() || {};
    return Response.json({ notes: typeof data.notes === "string" ? data.notes : "", notesUrl: typeof data.notesUrl === "string" ? data.notesUrl : "", videoUrl: typeof data.videoUrl === "string" ? data.videoUrl : "" });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load exercise resources." }, { status: 400 }); }
}
export async function PUT(request: Request) {
  try {
    const uid = await requireAdmin(request), resource = read(await request.json());
    await serverDb().doc(`ibExerciseResources/${id(resource.grade, resource.path)}`).set({ ...resource, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save exercise resources." }, { status: 400 }); }
}
