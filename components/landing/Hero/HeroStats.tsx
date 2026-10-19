import { FileText, Brain, Trophy } from "lucide-react";

const stats = [
  {
    icon: FileText,
    value: "500+",
    label: "Worksheets",
  },
  {
    icon: Brain,
    value: "1000+",
    label: "Practice Problems",
  },
  {
    icon: Trophy,
    value: "50+",
    label: "Learning Levels",
  },
];

export default function HeroStats() {
  return (
    <div className="rounded-2xl border-2 border-[#D4AF37] bg-white p-4 shadow-lg">

      <div className="grid grid-cols-3 divide-x divide-gray-200">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label}
                className="flex flex-col items-center justify-center px-3 py-2 text-center transition-all duration-300 hover:scale-105">
              <div className="mb-2 rounded-full bg-[#FFF5DB] p-3">

                <Icon
                  size={22}
                  className="text-[#D4AF37]"
                />

              </div>

              <h2 className="text-2xl font-bold text-[#B8860B]">
                {stat.value}
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {stat.label}
              </p>

            </div>
          );
        })}

      </div>

    </div>
  );
}