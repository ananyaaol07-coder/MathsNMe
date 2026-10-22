import Link from "next/link";
import { ArrowRight, CheckCircle2, BarChart3, Clock3, Target } from "lucide-react";
import ShortcutDemo from "./ShortcutDemo";

const section = "scroll-mt-24 px-6 py-16 sm:py-20";
const card = "rounded-3xl border border-[#eadfb9] bg-white p-7 shadow-lg";

function Heading({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl text-center">
    <p className="text-sm font-semibold tracking-widest text-[#B8860B]">{label}</p>
    <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{title}</h2>
    {children && <p className="mt-4 text-base leading-7 text-slate-600">{children}</p>}
  </div>;
}

export function LearningApproach() {
  return (
    <section id="learning-approach" aria-labelledby="approach-heading" className={section}>
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-widest text-[#B8860B]">SELF-PACED · IB-SEQUENCED · VEDIC MATHS</p>
          <h2 id="approach-heading" className="mt-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            Same syllabus.<br />
            <span className="text-[#D4AF37]">A fraction of the time.</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Build understanding with a step-by-step, IB-sequenced curriculum and strengthen calculation fluency with Vedic Maths techniques — at a pace that works for your child.
          </p>
          <Link href="#roadmap" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#E7C45A] bg-white px-7 py-4 font-semibold text-black shadow-lg transition hover:bg-[#D4AF37]">
            See the Learning Roadmap <ArrowRight size={18} className="shrink-0" />
          </Link>
        </div>
        <div className="min-w-0"><ShortcutDemo /></div>
      </div>
    </section>
  );
}

export function LearningProblem() {
  const items = [
    ["A pace that fits", "A classroom moves at a shared pace. Some students need more time on a difficult concept; others are ready for the next challenge."],
    ["Practice with a purpose", "More worksheets alone are not always the answer. A clear sequence helps students practise the right skills and learn from recurring mistakes."],
    ["A longer-term goal", "Learning goes beyond the next test. Consistent practice builds the confidence and independent thinking students need for the years ahead."],
  ];
  return <section className="min-w-0 scroll-mt-24" aria-label="The learning challenge"><div>
    <Heading label="THE CHALLENGE" title="Understanding is the start. Fluency takes practice.">Help your child connect what they know with the confidence and calculation skills to use it.</Heading>
    <div className="mt-10 grid grid-cols-1 gap-6">{items.map(([title, description], i) => <article className={card} key={title}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4CC] font-bold text-[#B8860B]">0{i + 1}</span>
      <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </article>)}</div>
  </div></section>;
}

export function LearningMethod() {
  const methods = [
    { label: "BUILD UNDERSTANDING", title: "IB-sequenced curriculum", description: "Structured practice develops concepts step by step, giving students a foundation to build on before moving to more demanding problems.", points: ["Difficulty grows one skill at a time", "Foundations come before advanced topics", "Practice connects concepts with problem solving"] },
    { label: "BUILD FLUENCY", title: "Vedic Maths techniques", description: "Alongside conceptual learning, practical calculation techniques help students recognise patterns and approach applicable problems more efficiently.", points: ["Understand why each technique works", "Build familiarity through regular practice", "Develop accuracy alongside calculation speed"] },
  ];
  return <section id="method" className="min-w-0 scroll-mt-24"><div>
    <Heading label="THE METHOD" title="Two systems, working together">Structured learning for depth. Vedic Maths for calculation fluency. Help your child build both.</Heading>
    <div className="mt-10 grid grid-cols-1 gap-6">{methods.map(method => <article className={card} key={method.title}>
      <p className="text-xs font-bold tracking-widest text-[#B8860B]">{method.label}</p><h3 className="mt-4 text-2xl font-bold text-slate-900">{method.title}</h3>
      <p className="mt-4 text-sm leading-7 text-slate-600">{method.description}</p>
      <ul className="mt-6 space-y-4">{method.points.map(point => <li className="flex gap-3 text-sm leading-6 text-slate-700" key={point}><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#B8860B]" />{point}</li>)}</ul>
    </article>)}</div>
  </div></section>;
}

export function LearningRoadmap() {
  const milestones = [
    ["1 Week", "Find your rhythm", "Establish a regular practice habit and identify a starting point."],
    ["1 Month", "Build foundations", "Work on recurring mistakes and strengthen the skills that need attention."],
    ["6 Months", "Develop fluency", "Aim to use familiar calculation techniques with greater accuracy and confidence."],
    ["2 Years", "Deepen understanding", "Build towards stronger grade-level understanding and more independent problem solving."],
    ["4–6 Years", "Think independently", "Grow towards confident mathematical reasoning and unfamiliar challenges."],
  ];
  return <section id="roadmap" className={section}><div className="mx-auto max-w-7xl">
    <Heading label="THE ROADMAP" title="The Student Success Framework">From this week’s practice habit to long-term mathematical thinking: a journey with meaningful goals along the way.</Heading>
    <ol className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">{milestones.map(([time, title, description]) => <li className={card} key={time}>
      <span className="mb-5 block h-3 w-3 rounded-full bg-[#D4AF37]" /><p className="text-xl font-bold text-[#B8860B]">{time}</p><h3 className="mt-3 font-bold text-slate-900">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </li>)}</ol>
    <p className="mt-6 text-center text-sm leading-6 text-slate-500">These milestones are guiding goals. Each student’s pace depends on their starting point, practice, and readiness.</p>
  </div></section>;
}

export function LearningProgress() {
  return <section id="learning-progress" className={section}><div className="mx-auto max-w-7xl">
    <Heading label="MAKE PROGRESS VISIBLE" title="Look beyond the final answer">Meaningful progress includes consistent practice, accurate work, and a growing ability to solve problems independently.</Heading>
    <div className="mt-10 grid gap-6 md:grid-cols-3">{[
      { icon: Clock3, title: "Practice habits", text: "Aim for at least 60 minutes of practice each week, spread across two or three sessions." },
      { icon: Target, title: "Accuracy and understanding", text: "Review mistakes to understand which concepts need another look and where confidence is growing." },
      { icon: BarChart3, title: "Progress over time", text: "Compare earlier work with current practice to recognise improvement and choose the next learning goal." },
    ].map(({ icon: Icon, title, text }) => <article className={card} key={title}><Icon className="text-[#B8860B]" size={28} /><h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></article>)}</div>
  </div></section>;
}

export function GetStarted() {
  return <section id="get-started" className={section}><div className="mx-auto max-w-7xl rounded-3xl border border-[#eadfb9] bg-[#FFF4CC]/60 px-6 py-12 text-center shadow-sm sm:px-12">
    <Heading label="GET STARTED" title="Find your child’s next step">Start your MathsNMe journey with structured practice, a clear direction, and room to learn at your own pace.</Heading>
    <div className="mt-8 flex flex-wrap justify-center gap-4">
      <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl border border-[#E7C45A] bg-white px-7 py-4 font-semibold text-slate-900 shadow-lg transition hover:bg-[#D4AF37]">Start Learning <ArrowRight size={18} /></Link>
      <Link href="#contact" className="inline-flex items-center rounded-xl border border-[#E7C45A] bg-white px-7 py-4 font-semibold text-slate-900 shadow-sm transition hover:bg-[#FFF4CC]">Talk to Us</Link>
    </div>
    <p className="mt-8 text-lg font-semibold italic text-[#B8860B]">“Transforming Students into Scholars.”</p>
  </div></section>;
}
