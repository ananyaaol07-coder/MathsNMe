import Image from "next/image";

export default function BrandMark({ className = "w-20", priority = false }: { className?: string; priority?: boolean }) {
  return <Image src="/mathsnme-mark-transparent.png" alt="MathsNMe" width={775} height={553} priority={priority} className={`h-auto object-contain ${className}`} />;
}
