"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { BarChart3, Brain, Calculator, CreditCard, FileChartColumn, LayoutDashboard, LockKeyhole, LogOut, Menu, Settings, ShoppingBag, Trophy, X } from "lucide-react";
import BrandLogo from "@/components/common/BrandLogo";
import { auth } from "@/lib/firebase";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Vedic Mathematics", icon: Calculator, href: "/topics/vedic-maths" },
  { label: "IB Mathematics", icon: Brain, href: "/topics/ib-mathematics" },
  { label: "Olympiad", icon: Trophy, href: "/topics/olympiad", locked: true },
  { label: "Progress", icon: BarChart3, href: "/dashboard#progress" },
  { label: "Reports", icon: FileChartColumn, href: "/dashboard/reports" },
  { label: "Payments", icon: CreditCard, href: "/dashboard#payments" },
  { label: "Shop", icon: ShoppingBag, href: "/dashboard#shop" },
  { label: "Settings", icon: Settings, href: "/profile" },
];

export default function StudentMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const close = () => dialog.current?.close();

  return <>
    <button type="button" onClick={() => { dialog.current?.showModal(); setOpen(true); }} aria-label="Open student menu" aria-expanded={open} className="rounded-xl border border-[#e8dfc8] bg-white p-2.5 text-slate-600 transition hover:border-[#D4AF37] hover:bg-[#fff8e4] hover:text-slate-950"><Menu size={22} /></button>
    <dialog ref={dialog} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) close(); }} aria-label="Student navigation" className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(86vw,320px)] max-w-none border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/35 backdrop:backdrop-blur-[2px]">
      <div className="flex min-h-full flex-col p-5">
        <div className="mb-8 flex items-center justify-between border-b border-[#eee7d5] pb-5">
          <Link href="/" onClick={close}><Image src="/student-sidebar-logo.png" alt="MathsNMe" width={1000} height={1000} sizes="80px" className="h-20 w-20 rounded-xl object-contain" /></Link>
          <button type="button" onClick={close} aria-label="Close student menu" className="rounded-xl border border-[#e8dfc8] p-2 text-slate-500 hover:bg-slate-50"><X size={20} /></button>
        </div>
        <nav className="space-y-1.5" aria-label="Student navigation">
          {navigation.map(({ label, icon: Icon, href, locked }) => {
            const active = !href.includes("#") && (pathname === href || (href.startsWith("/topics/") && pathname.startsWith(`${href}/`)));
            return locked ? <button key={label} type="button" disabled title="Unlocks after 1 year of active learning" className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-400"><Icon size={19} /><span className="flex-1">{label}</span><LockKeyhole size={15} /></button> : <Link key={label} href={href} onClick={close} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? "bg-[#fff4cc] text-[#8a6500]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon size={19} />{label}</Link>;
          })}
        </nav>
        <div className="mt-auto border-t border-[#eee7d5] pt-4">
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="button" onClick={async () => { try { await signOut(auth); close(); router.replace("/login"); } catch { setError("Unable to log out. Please try again."); } }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"><LogOut size={19} />Log out</button>
        </div>
      </div>
    </dialog>
  </>;
}

// Pages with their own header place the same menu beside their existing branding.
export function StudentNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasHeader = pathname === "/dashboard" || pathname.startsWith("/topics/ib-mathematics") || /^\/topics\/[^/]+$/.test(pathname);
  return <>{!hasHeader && <header className="border-b border-[#eadfb9] bg-white"><div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4"><StudentMenu /><Link href="/dashboard"><BrandLogo className="w-36" /></Link></div></header>}{children}</>;
}
