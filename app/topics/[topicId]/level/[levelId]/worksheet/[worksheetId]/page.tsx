import PracticeWorksheets from "@/components/practice/PracticeWorksheets";
export default async function WorksheetPage({ params }: { params: Promise<{ topicId: string; levelId: string; worksheetId: string }> }) {
  const { topicId, levelId, worksheetId } = await params;
  return <PracticeWorksheets topicId={topicId} levelId={Number(levelId)} worksheetId={worksheetId} />;
}
