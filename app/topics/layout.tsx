import { StudentNavigation } from "@/components/layout/StudentMenu";
import PracticeProvider from "@/components/practice/PracticeProvider";
import LearningAccess from "@/components/access/LearningAccess";
export default function TopicsLayout({ children }: { children: React.ReactNode }) { return <LearningAccess><PracticeProvider><StudentNavigation>{children}</StudentNavigation></PracticeProvider></LearningAccess>; }
