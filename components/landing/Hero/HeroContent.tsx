import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import HeroStats from "./HeroStats";

export default function HeroContent() {
  return (
    <div className="max-w-2xl">

      {/* Badge */}

      <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF4CC] px-5 py-2.5 shadow-md">

        <Sparkles size={18} className="text-[#D4AF37]" />

        <span className="font-semibold text-[#B8860B]">
          AI Powered Learning
        </span>

      </div>

      {/* Heading */}

      <h1 className="mt-8 text-5xl font-extrabold leading-[1.12] text-[#111827] sm:text-6xl lg:text-[2.85rem] xl:text-[3.85rem] 2xl:text-7xl">

        Master <span className="text-[#D4AF37]">Vedic Maths</span><br />
        with Smart Practice

      </h1>

      {/* Description */}

      <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">

        Transforming Students into Scholars through structured worksheets, AI-powered evaluation and personalized progress tracking.

      </p>

      {/* Buttons */}

      <div className="mt-10 flex flex-wrap gap-5">

        <Link
          href="/signup"
          className="group flex items-center gap-2 rounded-xl border border-[#E7C45A] bg-white px-7 py-4 font-semibold text-black shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-[#D4AF37]"
        >
          Start Learning

          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>

        <Link
          href="#learning-paths"
          className="group flex items-center gap-2 rounded-xl border border-[#E7C45A] bg-white px-7 py-4 font-semibold text-black shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-[#D4AF37]"
        >
          Explore Learning Paths
        </Link>

      </div>

      {/* Stats */}

      <div className="mt-12">

        <HeroStats />

      </div>

      {/* Feature Chips */}

      <div className="mt-10 flex flex-wrap gap-4">

        <span className="rounded-full border border-[#E7C45A] bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          📄 Worksheets
        </span>

        <span className="rounded-full border border-[#E7C45A] bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          🤖 AI Evaluation
        </span>

        <span className="rounded-full border border-[#E7C45A] bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
          📈 Progress Tracking
        </span>

      </div>

    </div>
  );
}
