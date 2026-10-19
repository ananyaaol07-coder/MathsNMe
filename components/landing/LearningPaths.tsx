import { Brain, Calculator, LockKeyhole, Trophy } from "lucide-react";

const learningPaths = [
  {
    title: "Vedic Maths",
    description: "Build calculation speed with practical Vedic Maths methods.",
    icon: Calculator,
    iconClass: "bg-[#fff1b8] text-[#c98900]",
  },
  {
    title: "IB Mathematics",
    description: "Strengthen concepts through structured, problem-based practice.",
    icon: Brain,
    iconClass: "bg-[#dfeaff] text-[#2563eb]",
  },
  {
    title: "Olympiad Preparation",
    description: "Advanced challenges for students ready for the next step.",
    icon: Trophy,
    iconClass: "bg-[#e2f8ea] text-[#16a34a]",
    locked: true,
  },
];

export default function LearningPaths() {
  return (
    <section id="learning-paths" className="scroll-mt-24 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-semibold text-[#b8860b]">CHOOSE YOUR JOURNEY</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Learning paths for every goal
          </h2>
          <p className="mt-4 text-slate-600">
            Start with a pre-test and progress at the level that is right for you.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {learningPaths.map((path) => {
            const Icon = path.icon;

            return (
              <article
                key={path.title}
                className="rounded-3xl border border-[#eadfb9] bg-white p-7 shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${path.iconClass}`}>
                  <Icon size={28} />
                </div>

                <div className="mt-6 flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-slate-900">{path.title}</h3>
                  {path.locked && <LockKeyhole size={18} className="mt-1 text-slate-400" />}
                </div>

                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                  {path.description}
                </p>

                {path.locked && (
                  <p className="mt-4 rounded-xl bg-[#fff8e4] px-3 py-2 text-xs font-semibold text-[#9a7200]">
                    Unlocks after 1 year of active learning
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
