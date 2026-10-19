import { CheckCircle2 } from "lucide-react";

interface FloatingCardProps {
  icon: string;
  title: string;
  subtitle: string;
  color?: "yellow" | "green" | "blue";
  success?: boolean;
}

export default function FloatingCard({
  icon,
  title,
  subtitle,
  color = "yellow",
  success = false,
}: FloatingCardProps) {
  const colors = {
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white/95 px-5 py-4 shadow-xl backdrop-blur-md border border-white
        transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
      {/* Icon */}

      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${colors[color]}`}>
        {icon}
      </div>

      {/* Text */}

      <div className="min-w-[170px]">

        <h3 className="text-2xl font-bold text-slate-800">
          {title}
        </h3>

        <p className="mt-1 text-lg text-slate-500">
          {subtitle}
        </p>

      </div>

      {/* Success */}

      {success && (
        <CheckCircle2
          size={28}
          className="text-green-500"
        />
      )}
    </div>
  );
}