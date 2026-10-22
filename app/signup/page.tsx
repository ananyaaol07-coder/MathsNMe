import BrandLogo from "@/components/common/BrandLogo";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Video } from "lucide-react";
import WebinarForm from "@/components/webinar/WebinarForm";

export const metadata = { title: "Register | MathsNMe Parent Webinar", description: "Book a one-to-one parent webinar to discuss your child’s maths learning needs." };
export default function SignupPage() {
  return <div className="min-h-screen bg-gradient-to-br from-white via-[#FFFDF8] to-[#FFF8EA] px-5 py-8 text-slate-900 sm:px-8">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3 text-2xl font-black"><BrandLogo priority /></Link>
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={16} />Back to home</Link>
    </header>
    <div className="mx-auto mt-10 grid max-w-7xl items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
      <aside aria-labelledby="webinar-poster-heading" className="overflow-hidden rounded-3xl border border-[#eadfb9] bg-[#FFF8EA] shadow-lg lg:sticky lg:top-8">
        <div className="h-2 bg-gradient-to-r from-[#FFF0BD] via-[#D4AF37] to-[#FFF0BD]" />
        <div className="p-7 sm:p-9">
          <p className="text-xs font-bold tracking-[0.16em] text-[#9a7200]">YOUR MATHSNME JOURNEY STARTS HERE</p>
          <h1 id="webinar-poster-heading" className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">Your child.<br />Their maths.<br /><span className="text-[#B8860B]">Let’s talk.</span></h1>
          <p className="mt-5 text-xl font-bold">One-to-one parent webinar</p>
          <p className="mt-3 text-base leading-7 text-slate-600">A personal conversation about your child’s learning needs, confidence, and next steps in maths.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[#8a6500]"><span className="flex items-center gap-2 rounded-full bg-white px-4 py-2"><Video size={17} />On Zoom</span><span className="rounded-full bg-white px-4 py-2">60 minutes · IST</span></div>
          <ul className="mt-7 space-y-4 text-sm leading-6 text-slate-700">{["Discuss your child’s strengths and learning needs", "Explore structured practice and Vedic Maths", "Ask your questions in a dedicated session"].map(item => <li key={item} className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-[#B8860B]" />{item}</li>)}</ul>
        </div>
      </aside>
      <section aria-labelledby="registration-heading"><p className="text-xs font-bold tracking-widest text-[#B8860B]">STEP 1 · REGISTER FOR YOUR WEBINAR</p><h2 id="registration-heading" className="mt-3 text-3xl font-bold">Let’s find a time to meet.</h2><p className="mb-6 mt-3 leading-7 text-slate-600">Tell us a little about you and your child, then choose your preferred time below.</p><WebinarForm /><p className="my-6 text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="font-bold text-[#9a7200] underline">Log in</Link></p></section>
    </div>
  </div>;
}
