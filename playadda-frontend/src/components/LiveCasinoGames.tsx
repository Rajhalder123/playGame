"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";

/* Live Casino games use rich SVG/CSS backgrounds since image quota was exhausted.
   Each card has a unique color scheme and animated SVG overlay to feel alive. */

const liveCasinoGames = [
  { name: "EVOLUTION GAMING BAC BO", gradient: "from-indigo-900 to-purple-950", accent: "#818cf8", icon: "dice" },
  { name: "BET STACKER BLACKJACK 1", gradient: "from-emerald-900 to-green-950", accent: "#34d399", icon: "cards" },
  { name: "BLACKJACK PARTY", gradient: "from-amber-900 to-orange-950", accent: "#fbbf24", icon: "cards" },
  { name: "DRAGON TIGER", gradient: "from-red-900 to-rose-950", accent: "#fb7185", icon: "fire" },
  { name: "LIGHTNING BAC BO", gradient: "from-yellow-800 to-amber-950", accent: "#facc15", icon: "bolt" },
  { name: "LIGHTNING BLACKJACK", gradient: "from-violet-900 to-purple-950", accent: "#a78bfa", icon: "bolt" },
  { name: "LIGHTNING DICE", gradient: "from-cyan-900 to-blue-950", accent: "#22d3ee", icon: "dice" },
  { name: "LIGHTNING SIC BO", gradient: "from-rose-900 to-pink-950", accent: "#f43f5e", icon: "bolt" },
];

const DiceIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none">
    <rect x="5" y="5" width="50" height="50" rx="10" fill={color} opacity="0.3" stroke={color} strokeWidth="2" />
    <circle cx="20" cy="20" r="4" fill={color} /><circle cx="40" cy="20" r="4" fill={color} />
    <circle cx="20" cy="40" r="4" fill={color} /><circle cx="40" cy="40" r="4" fill={color} />
    <circle cx="30" cy="30" r="4" fill={color} />
  </svg>
);

const CardsIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none">
    <rect x="8" y="5" width="30" height="45" rx="5" fill={color} opacity="0.25" stroke={color} strokeWidth="2" transform="rotate(-8 23 27)" />
    <rect x="22" y="8" width="30" height="45" rx="5" fill={color} opacity="0.4" stroke={color} strokeWidth="2" transform="rotate(8 37 30)" />
    <text x="37" y="38" fill={color} fontSize="20" fontWeight="bold" textAnchor="middle">A</text>
  </svg>
);

const BoltIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none">
    <path d="M35 5 L15 32 H28 L22 55 L45 25 H32 Z" fill={color} opacity="0.4" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const FireIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 60 60" className="w-16 h-16" fill="none">
    <path d="M30 5 C25 15, 10 25, 15 40 C18 50, 25 55, 30 55 C35 55, 42 50, 45 40 C50 25, 35 15, 30 5 Z" fill={color} opacity="0.3" stroke={color} strokeWidth="2" />
    <path d="M30 25 C28 30, 22 35, 25 42 C27 47, 30 48, 33 42 C36 35, 32 30, 30 25 Z" fill={color} opacity="0.6" />
  </svg>
);

const iconComponents: Record<string, React.FC<{ color: string }>> = {
  dice: DiceIcon,
  cards: CardsIcon,
  bolt: BoltIcon,
  fire: FireIcon,
};

export default function LiveCasinoGames() {
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
              LIVE CASINO GAMES
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
          {liveCasinoGames.map((game) => {
            const IconComp = iconComponents[game.icon];
            return (
              <motion.a
                key={game.name}
                href="#"
                className="group flex-shrink-0 snap-start"
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className={`relative w-[170px] h-[220px] md:w-[190px] md:h-[250px] rounded-2xl overflow-hidden border-2 border-transparent hover:border-brand-lime transition-all duration-300 shadow-lg hover:shadow-brand-lime/20 bg-gradient-to-b ${game.gradient}`}>
                  {/* Live Badge */}
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: game.accent }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: game.accent }} />
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">LIVE</span>
                  </div>

                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: `radial-gradient(circle at 30% 50%, ${game.accent} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />

                  {/* Animated Icon */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <motion.div
                      animate={{ y: [-8, 8, -8], rotate: [-3, 3, -3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="opacity-60 group-hover:opacity-90 transition-opacity duration-300"
                    >
                      <IconComp color={game.accent} />
                    </motion.div>
                  </div>

                  {/* Sparkle Particles */}
                  {[
                    { x: "20%", y: "25%", d: 2.0, dl: 0 },
                    { x: "75%", y: "35%", d: 2.5, dl: 0.5 },
                    { x: "40%", y: "70%", d: 1.8, dl: 1.0 },
                  ].map((p, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full z-10"
                      style={{ left: p.x, top: p.y, backgroundColor: game.accent }}
                      animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
                      transition={{ duration: p.d, repeat: Infinity, delay: p.dl }}
                    />
                  ))}

                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
                    animate={{ backgroundPosition: ["-100% 0", "200% 0"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />

                  {/* Name */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider text-center drop-shadow-lg leading-tight">
                      {game.name}
                    </p>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
