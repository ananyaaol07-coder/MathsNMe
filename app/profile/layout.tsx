import LearningAccess from "@/components/access/LearningAccess";
import { StudentNavigation } from "@/components/layout/StudentMenu";
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <LearningAccess><StudentNavigation>{children}</StudentNavigation></LearningAccess>;
}
