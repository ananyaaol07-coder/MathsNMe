"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  Brain,
  Trophy,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

const cards = [
  {
    title: "Worksheet #12",
    subtitle: "Completed Successfully",
    icon: FileText,
    color: "bg-yellow-100 text-yellow-600",
    position: "top-23 -left-24",
    layer: "z-30",
  },

  {
    title: "AI Evaluation",
    subtitle: "Accuracy : 98%",
    icon: Brain,
    color: "bg-blue-100 text-blue-600",
    position: "top-20 -right-23",
    layer: "z-10",
    success: true,
  },

  {
    title: "Progress",
    subtitle: "82% Completed",
    icon: BarChart3,
    color: "bg-green-100 text-green-600",
    position: "bottom-22 -left-10",
    layer: "z-10",
  },

  {
    title: "Current Level",
    subtitle: "Level 3",
    icon: Trophy,
    color: "bg-yellow-100 text-yellow-600",
    position: "bottom-23 -right-20",
    layer: "z-30",
  },
];

export default function HeroVisual() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The canvas and overhanging cards span 668px; keep a small edge margin.
    const observer = new ResizeObserver(([entry]) => {
      const scale = Math.min(0.85, entry.contentRect.width / 688);
      container.style.setProperty("--visual-scale", String(scale));
      container.style.setProperty("--visual-height", `${580 * scale}px`);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative -mx-6 flex h-[var(--visual-height,240px)] w-[calc(100%+3rem)] min-w-0 items-start justify-center sm:mx-0 sm:w-full lg:h-[580px]">
      <div className="relative flex h-[580px] w-[480px] shrink-0 origin-top scale-[var(--visual-scale,0.35)] items-center justify-center overflow-visible lg:w-full lg:max-w-[620px] lg:origin-center lg:scale-[0.85] lg:-translate-y-20">

        {/* Glow */}
        <div className="absolute h-[420px] w-[420px] rounded-full bg-[#FFD84D]/30 blur-[80px]" />

        {/* Large Circle */}
        <div className="absolute h-[560px] w-[560px] rounded-full border border-dashed border-[#E8C96A]" />

        {/* Inner Circle */}
        <div className="absolute h-[420px] w-[420px] rounded-full bg-[#FFF6D5]/60 blur-sm" />

        {/* Decorative Dots */}
        <div className="absolute right-6 top-6 grid grid-cols-5 gap-3 opacity-40">
          {Array.from({ length: 25 }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[#E7C45A]"
            />
          ))}
        </div>

        <div className="absolute bottom-4 left-6 grid grid-cols-5 gap-3 opacity-30">
          {Array.from({ length: 15 }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[#E7C45A]"
            />
          ))}
        </div>

        {/* Decorative Plus */}
        <span className="absolute left-20 top-52 text-4xl text-[#D4AF37]">
          +
        </span>

        <span className="absolute right-28 top-10 text-4xl text-[#D4AF37]">
          +
        </span>

        <span className="absolute bottom-32 left-32 text-4xl text-[#D4AF37]">
          +
        </span>

        <span className="absolute bottom-24 right-24 text-4xl text-[#D4AF37]">
          +
        </span>

        {/* Logo */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <Image src="/mathsnme-hero-original.png" alt="MathsNMe" width={260} height={260} priority className="hero-float hero-float-logo drop-shadow-[0_20px_40px_rgba(212,175,55,0.45)]" />
        </div>

        {/* Floating Cards */}
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`
                absolute
                ${card.position}
                ${card.layer}
              `}
            >
              <div
                style={{ animationDelay: `${-0.8 - index * 0.9}s` }}
                className="
                hero-float
                flex
                items-center
                gap-4
                rounded-3xl
                bg-white
                px-5
                py-4
                shadow-2xl
                border
                border-white
                "
              >
                {/* Icon */}

                <div
                  className={`
                    h-16
                    w-16
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    ${card.color}
                  `}
                >
                  <Icon size={30} />
                </div>

                {/* Text */}

                <div className="flex-1">
                  <h3 className="text-lg font-bold leading-tight text-slate-800 text-xl">
                    {card.title}
                  </h3>

                  <p className="mt-1 text-base leading-snug text-slate-500">
                    {card.subtitle}
                  </p>
                </div>

                {/* Success */}

                {card.success && (
                  <CheckCircle2
                    size={30}
                    className="text-green-500"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
