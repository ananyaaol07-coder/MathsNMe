import { requireLearner } from "@/lib/server/practice";
import { createWaygroundPdf } from "@/lib/server/wayground-pdf";
import type { WaygroundReportInput } from "@/lib/reports/wayground";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (typeof id !== "string" || !/^[a-f0-9]{32}$/.test(id)) throw new Error("Invalid report.");
    const { uid, db, profile } = await requireLearner(request);
    const snapshot = await db.doc(`studentReports/${uid}/items/${id}`).get();
    if (!snapshot.exists) throw new Error("Report not found.");
    const report = snapshot.data()! as WaygroundReportInput;
    const file = await createWaygroundPdf({ ...report, studentName: profile.studentName || "Student", completedDate: new Date(report.capturedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) });
    return new Response(new Uint8Array(file), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="mathsnme-${id}.pdf"` } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create the PDF." }, { status: 400 });
  }
}
