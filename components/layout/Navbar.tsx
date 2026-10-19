"use client";

import DisclaimerModal from "@/components/common/DisclaimerModal";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const closeDisclaimer = useCallback(() => setIsDisclaimerOpen(false), []);

  const acceptDisclaimer = () => {
    setIsDisclaimerOpen(false);
    router.push("/signup");
  };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-[#eadfb9] bg-white/88 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 rounded-2xl transition hover:opacity-90">
          <Image
            src="/logo.png"
            alt="MathsNMe Logo"
            width={45}
            height={45}
            priority
            className="rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
          />

          <div>
            <h1 className="text-[1.85rem] font-black tracking-[-0.03em] text-slate-900">
              MathsNMe
            </h1>
          </div>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-2 rounded-full bg-transparent px-3 py-2 text-[0.95rem] font-semibold text-slate-700 md:flex">

          <Link href="/" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">Home</Link>

          <Link href="/#learning-paths" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">Learning Paths</Link>

          <Link href="/#about" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">About</Link>

          <Link href="/#contact" className="rounded-full px-4 py-2 transition hover:font-extrabold hover:text-slate-900">Contact</Link>

        </div>

        {/* Buttons */}
        <div className="flex items-center gap-4">

          <Link
            href="/login"
            className="font-semibold text-slate-700 transition hover:text-black"
          >
            Login
          </Link>

          <button
            type="button"
            onClick={() => setIsDisclaimerOpen(true)}
            className="rounded-2xl bg-[#D4AF37] px-5 py-2.5 font-semibold text-black shadow-[0_14px_30px_rgba(212,175,55,0.22)] transition hover:-translate-y-0.5 hover:bg-[#c79d18]"
          >
            Get Started
          </button>

        </div>

      </nav>
    </header>
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={closeDisclaimer}
        onAccept={acceptDisclaimer}
      />
    </>
  );
}
