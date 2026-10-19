import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero/Hero";
import LearningPaths from "@/components/landing/LearningPaths";

import { LearningApproach, LearningProblem, LearningMethod, LearningRoadmap, LearningProgress, GetStarted } from "@/components/landing/LearningStory";

function SectionDivider() {
  return (
    <div aria-hidden="true" className="px-6">
      <div className="mx-auto h-px max-w-7xl bg-linear-to-r from-[#E7C45A]/10 via-[#D4AF37]/45 to-[#E7C45A]/10" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF8EA]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-[#F7D65D]/10 blur-[140px]" />
          <div className="absolute right-0 top-24 h-[450px] w-[450px] rounded-full bg-[#FFECA8]/40 blur-[110px]" />
          <div className="absolute left-0 top-[500px] h-[350px] w-[350px] rounded-full bg-[#FFF3C5]/30 blur-[120px]" />
        </div>

        <div className="relative">
          <Hero />
          <SectionDivider />
          <LearningApproach />
          <SectionDivider />
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-8 xl:gap-12">
            <LearningProblem />
            <div aria-hidden="true" className="h-px bg-linear-to-r from-[#E7C45A]/10 via-[#D4AF37]/45 to-[#E7C45A]/10 lg:h-auto lg:bg-linear-to-b" />
            <LearningMethod />
          </div>
          <SectionDivider />
          <LearningPaths />
          <SectionDivider />
          <LearningRoadmap />
          <SectionDivider />
          <LearningProgress />
          <SectionDivider />
          <GetStarted />
        </div>
      </div>
    </>
  );
}
