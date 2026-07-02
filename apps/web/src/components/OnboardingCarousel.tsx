import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TranslationKey } from "@hafi/i18n";
import { useT } from "@hafi/i18n";

const SLIDES: { id: string; image: string; titleKey: TranslationKey; subtitleKey: TranslationKey }[] = [
  {
    id: "beauty",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
    titleKey: "onboarding.beauty.title",
    subtitleKey: "onboarding.beauty.subtitle",
  },
  {
    id: "youth",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80",
    titleKey: "onboarding.youth.title",
    subtitleKey: "onboarding.youth.subtitle",
  },
  {
    id: "trades",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80",
    titleKey: "onboarding.trades.title",
    subtitleKey: "onboarding.trades.subtitle",
  },
  {
    id: "community",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80",
    titleKey: "onboarding.community.title",
    subtitleKey: "onboarding.community.subtitle",
  },
];

export default function OnboardingCarousel() {
  const t = useT();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full min-h-[420px] lg:min-h-screen overflow-hidden bg-hafi-dark">
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <img src={s.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-hafi-dark via-hafi-dark/70 to-hafi-dark/30" />
        </div>
      ))}

      <div className="relative z-10 flex flex-col justify-end h-full min-h-[420px] lg:min-h-screen p-8 sm:p-12 lg:p-16">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-lg">
            H
          </div>
          <span className="text-white/90 font-bold tracking-wide">Hafi</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white leading-[1.05] max-w-xl">
          {t(slide.titleKey)}
        </h1>
        <p className="mt-4 text-lg text-purple-100 max-w-md leading-relaxed">{t(slide.subtitleKey)}</p>

        <div className="flex items-center gap-4 mt-10">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
            className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
            className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
