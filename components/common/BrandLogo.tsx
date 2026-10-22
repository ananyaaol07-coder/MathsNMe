import Image from "next/image";

export default function BrandLogo({ className = "w-40 sm:w-52", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/mathsnme-brand.png" alt="Maths n Me — Transforming Student to Scholar" width={2170} height={619} priority={priority} className={`h-auto object-contain ${className}`} />;
}
