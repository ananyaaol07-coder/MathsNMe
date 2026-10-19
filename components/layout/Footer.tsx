import About from "@/components/landing/About";
import Contact from "@/components/landing/Contact";

export default function Footer() {
  return (
    <footer className="border-t border-[#eadfb9] bg-[#fffaf0] px-6 py-8 text-slate-600">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 border-b border-[#eadfb9] pb-8 md:grid-cols-2">
          <About />
          <Contact />
        </div>

        <p className="pt-7 text-center text-sm leading-6 sm:text-left">
          <span className="font-bold text-slate-800">MathsNMe Learning Policy: </span>
          Students must complete at least 60 minutes of practice each week,
          spread across a minimum of 2 – 3 sessions. Missed daily practice may be
          made up on another day. Failure to meet the weekly requirement may
          result in a payment requirement and temporary restriction of platform
          access until the requirement is resolved. Continued lack of participation or progress may
          result in account review and removal. MathsNMe supports Vedic Maths,
          IB Maths, and problem-solving skills; it does not guarantee improvement
          in school examination marks. Olympiad access is available only after at
          least one year of active learning and is based on the student’s
          performance and readiness. By using MathsNMe, students and
          parents/guardians agree to these policies.
        </p>

        <p className="mt-5 border-t border-[#eadfb9] pt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} MathsNMe. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
