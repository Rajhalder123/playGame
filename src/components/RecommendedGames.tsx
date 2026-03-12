"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const recommendedGames = [
  { name: "ANDAR BAHAR", image: "/recommended/andar_bahar.png", badge: "MACHI" },
  { name: "BACARRAT", image: "/recommended/baccarat.png", badge: "OMACHI" },
  { name: "MUFLIS TEENPATTI", image: "/recommended/teenpatti.png", badge: "MACHI GAMING" },
  { name: "BOLLYWOOD CASINO", image: "/recommended/bollywood_casino.png", badge: "OMACHI" },
  { name: "DRAGON TIGER", image: "/recommended/dragon_tiger.png", badge: "MACHI GAMING" },
  { name: "DRAGON TIGER 2", image: "/recommended/dragon_tiger.png", badge: "MACHI GAMING" },
  { name: "INSTANT 2 CARDS TEENPATTI", image: "/recommended/teenpatti.png", badge: "MACHI" },
  { name: "LUCKY 7", image: "/recommended/andar_bahar.png", badge: "OMACHI" },
  { name: "POKER", image: "/recommended/baccarat.png", badge: "MACHI GAMING" },
];

export default function RecommendedGames() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    const el = scrollRef.current;
    if (direction === "right") {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: amount, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft <= 10) {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -amount, behavior: "smooth" });
      }
    }
  }, []);

  return (
    <section className="bg-brand-sidebar border-t border-brand-green/30 pt-4 pb-8">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white italic tracking-wide uppercase">
              RECOMMENDED GAMES
            </h2>
            <div className="w-16 h-1 bg-brand-accent rounded-full mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll("left")} className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border text-white hover:bg-brand-accent hover:border-brand-accent transition-all duration-200" aria-label="Scroll left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button onClick={() => scroll("right")} className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border text-white hover:bg-brand-accent hover:border-brand-accent transition-all duration-200" aria-label="Scroll right">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        {/* Scrollable Cards */}
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {recommendedGames.map((game) => (
            <motion.a
              key={game.name}
              href="#"
              className="group flex-shrink-0 snap-start"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="relative w-[150px] h-[200px] md:w-[170px] md:h-[230px] rounded-2xl overflow-hidden border-2 border-transparent hover:border-brand-lime transition-all duration-300 shadow-lg hover:shadow-brand-lime/20">
                {/* Badge */}
                <div className="absolute top-2 left-2 z-20">
                  <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-black/70 text-brand-lime rounded-md border border-brand-lime/30 backdrop-blur-sm">
                    {game.badge}
                  </span>
                </div>

                {/* Image */}
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="170px"
                />

                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
                  animate={{ backgroundPosition: ["-100% 0", "200% 0"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                {/* Name */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                  <p className="text-xs font-bold text-white uppercase tracking-wider text-center drop-shadow-lg leading-tight">
                    {game.name}
                  </p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
