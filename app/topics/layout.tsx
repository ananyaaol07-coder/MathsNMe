import PracticeProvider from "@/components/practice/PracticeProvider";
import LearningAccess from "@/components/access/LearningAccess";
export default function TopicsLayout({ children }: { children: React.ReactNode }) { return <LearningAccess><PracticeProvider>{children}</PracticeProvider></LearningAccess>; }
