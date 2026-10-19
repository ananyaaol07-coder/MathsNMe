import HeroContent from "./HeroContent";
import HeroVisual from "./HeroVisual";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-8 py-14">

        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">

          <HeroContent />

          <HeroVisual />

        </div>

      </div>

    </section>
  );
}
