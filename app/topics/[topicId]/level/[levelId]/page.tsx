import PracticeWorksheets from "@/components/practice/PracticeWorksheets";
export default async function LevelPage({ params }: { params: Promise<{ topicId: string; levelId: string }> }) {
  const { topicId, levelId } = await params;
  return <PracticeWorksheets topicId={topicId} levelId={Number(levelId)} />;
}
