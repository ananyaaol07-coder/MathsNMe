"use client";

import BrandLogo from "@/components/common/BrandLogo";
import Link from "next/link";

export default function Navbar() {
  return (
    <>
    <header className="sticky top-0 z-50 border-b border-[#eadfb9] bg-white/88 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6 sm:py-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-2xl transition hover:opacity-90 sm:gap-3 lg:justify-self-start">
          <BrandLogo priority className="w-36 sm:w-52" />
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-2 rounded-full bg-transparent px-3 py-2 text-[0.95rem] font-semibold text-slate-700 lg:flex">

          <Link href="/" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">Home</Link>

          <Link href="/#learning-paths" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">Learning Paths</Link>

          <Link href="/#about" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">About</Link>

          <Link href="/#contact" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">Contact</Link>

        </div>

        {/* Buttons */}
        <div className="ml-auto flex shrink-0 items-center gap-3 whitespace-nowrap text-sm sm:gap-4 sm:text-base lg:ml-0 lg:justify-self-end">

          <Link
            href="/login"
            className="inline-flex min-h-11 items-center font-semibold text-slate-700 transition hover:text-black"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-2xl bg-[#D4AF37] px-3 py-2.5 font-semibold text-black shadow-[0_14px_30px_rgba(212,175,55,0.22)] transition hover:-translate-y-0.5 hover:bg-[#c79d18] sm:px-5"
          >
            Register
          </Link>

        </div>

      </nav>
    </header>
    </>
  );
}
