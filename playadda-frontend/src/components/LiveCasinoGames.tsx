"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import CasinoGameModal, { type Game } from "./CasinoGameModal";

const CATEGORIES = ["All", "Live Casino", "Indian Games", "Crash Games", "Slots"];

const GAME_GRADIENTS: Record<string, { gradient: string; accent: string; icon: string }> = {
  "Live Casino":   { gradient: "from-indigo-900 to-purple-950", accent: "#818cf8", icon: "cards" },
  "Indian Games":  { gradient: "from-orange-900 to-red-950",    accent: "#fb923c", icon: "fire" },
  "Crash Games":   { gradient: "from-green-900 to-emerald-950", accent: "#34d399", icon: "bolt" },
  "Slots":         { gradient: "from-amber-900 to-yellow-950",  accent: "#fbbf24", icon: "dice" },
};

// Local fallback catalogue (mirrors SportsProviderService.GAME_CATALOGUE)
const LOCAL_GAMES: Game[] = [
  { id: "crazy-time-001", name: "Crazy Time", category: "Live Casino", provider: "Evolution", thumbnail: "crazy-time", isHot: true, minBet: 10, maxBet: 100000 },
  { id: "lightning-roulette-001", name: "Lightning Roulette", category: "Live Casino", provider: "Evolution", thumbnail: "lightning-roulette", isHot: true, minBet: 10, maxBet: 50000 },
  { id: "blackjack-001", name: "Blackjack Live", category: "Live Casino", provider: "Evolution", thumbnail: "blackjack", isHot: false, minBet: 50, maxBet: 200000 },
  { id: "baccarat-001", name: "Baccarat Speed", category: "Live Casino", provider: "Evolution", thumbnail: "baccarat", isHot: false, minBet: 25, maxBet: 100000 },
  { id: "teen-patti-001", name: "Teen Patti Live", category: "Indian Games", provider: "Ezugi", thumbnail: "teen-patti", isHot: true, minBet: 10, maxBet: 50000 },
  { id: "andar-bahar-001", name: "Andar Bahar Live", category: "Indian Games", provider: "Ezugi", thumbnail: "andar-bahar", isHot: true, minBet: 10, maxBet: 25000 },
  { id: "dragon-tiger-001", name: "Dragon Tiger", category: "Indian Games", provider: "Ezugi", thumbnail: "dragon-tiger", isHot: false, minBet: 10, maxBet: 25000 },
  { id: "aviator-001", name: "Aviator", category: "Crash Games", provider: "Spribe", thumbnail: "aviator", isHot: true, minBet: 10, maxBet: 50000 },
  { id: "jetx-001", name: "JetX", category: "Crash Games", provider: "SmartSoft", thumbnail: "jetx", isHot: false, minBet: 10, maxBet: 50000 },
  { id: "gates-olympus-001", name: "Gates of Olympus", category: "Slots", provider: "Pragmatic", thumbnail: "gates-olympus", isHot: true, minBet: 10, maxBet: 25000 },
  { id: "starburst-001", name: "Starburst", category: "Slots", provider: "NetEnt", thumbnail: "starburst", isHot: false, minBet: 10, maxBet: 5000 },
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
const iconComponents: Record<string, React.FC<{ color: string }>> = { dice: DiceIcon, cards: CardsIcon, bolt: BoltIcon, fire: FireIcon };

export default function LiveCasinoGames() {
  const { isLoggedIn, openLogin } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [games, setGames] = useState<Game[]>(LOCAL_GAMES);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Fetch from backend catalogue
  useEffect(() => {
    api.get("/casino/games").then((res) => {
      const data: Game[] = (res.data?.data || res.data)?.data || (res.data?.data || res.data) || LOCAL_GAMES;
      if (Array.isArray(data) && data.length > 0) setGames(data);
    }).catch(() => { /* use local fallback */ });
  }, []);

  const filteredGames = activeCategory === "All" ? games : games.filter((g) => g.category === activeCategory);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    const el = scrollRef.current;
    if (direction === "right") {
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 10
        ? el.scrollTo({ left: 0, behavior: "smooth" })
        : el.scrollBy({ left: amount, behavior: "smooth" });
    } else {
      el.scrollLeft <= 10
        ? el.scrollTo({ left: el.scrollWidth, behavior: "smooth" })
        : el.scrollBy({ left: -amount, behavior: "smooth" });
    }
  }, []);

  const handlePlay = (game: Game) => {
    if (!isLoggedIn) { openLogin(); return; }
    setSelectedGame(game);
  };

  return (
    <section className="bg-brand-sidebar border-t border-brand-green/30 pt-4 pb-8">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" : "bg-brand-card border border-brand-border text-gray-400 hover:text-white"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Cards */}
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {filteredGames.map((game) => {
            const style = GAME_GRADIENTS[game.category] || GAME_GRADIENTS["Live Casino"];

            // Map game names to AI-generated photo backgrounds
            const gn = game.name.toLowerCase();
            const thumbImg =
              gn.includes("crazy time") || gn.includes("crazytime") ? "/games/crazy-time.png" :
              gn.includes("baccarat") ? "/games/baccarat.png" :
              gn.includes("roulette") ? "/games/roulette.png" :
              gn.includes("blackjack") ? "/games/blackjack.png" :
              gn.includes("dragon") ? "/games/dragon-tiger.png" :
              gn.includes("teen") || gn.includes("andar") || gn.includes("32 cards") ? "/games/teen-patti.png" :
              gn.includes("aviator") || gn.includes("jet") || gn.includes("crash") ? "/games/aviator.png" :
              gn.includes("starburst") || gn.includes("gates") || gn.includes("mines") ? "/games/slots.png" :
              game.category === "Crash Games" ? "/games/aviator.png" :
              game.category === "Slots" ? "/games/slots.png" :
              game.category === "Indian Games" ? "/games/teen-patti.png" : "";

            return (
              <motion.div key={game.id} className="group flex-shrink-0 snap-start" whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <div className={`relative w-[160px] h-[210px] md:w-[185px] md:h-[240px] rounded-2xl overflow-hidden border-2 border-transparent hover:border-brand-lime transition-all duration-300 shadow-lg hover:shadow-brand-lime/20 cursor-pointer`}
                  style={{ background: `linear-gradient(180deg, #0a0f14 0%, #111827 100%)` }}
                  onClick={() => handlePlay(game)}>

                  {/* AI Photo Background */}
                  {thumbImg && (
                    <div className="absolute inset-0 z-0"
                      style={{
                        backgroundImage: `url('${thumbImg}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "brightness(0.65) saturate(1.2)",
                        transition: "filter 0.3s",
                      }}
                    />
                  )}
                  {!thumbImg && (
                    <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(180deg, ${style.gradient.split(" ")[1] || "#1a1a2e"} 0%, #050d08 100%)` }} />
                  )}

                  {/* Hover brighten effect */}
                  <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundImage: thumbImg ? `url('${thumbImg}')` : "none", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.9) saturate(1.4)" }} />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />

                  {/* Live Badge */}
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: style.accent }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: style.accent }} />
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">LIVE</span>
                  </div>
                  {game.isHot && (
                    <div className="absolute top-2 right-2 z-20">
                      <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full uppercase">🔥 HOT</span>
                    </div>
                  )}

                  {/* Shimmer sweep */}
                  <motion.div className="absolute inset-0 z-10 pointer-events-none"
                    style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)", backgroundSize: "200% 100%" }}
                    animate={{ backgroundPosition: ["-100% 0", "200% 0"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }} />

                  {/* Name & Play */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1.5">
                      <div className="bg-brand-lime text-black text-[10px] font-black text-center py-1 rounded-lg uppercase tracking-wide">▶ Play Now</div>
                    </div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider text-center drop-shadow-lg leading-tight">{game.name}</p>
                    <p className="text-[9px] text-center text-white/50 mt-0.5">{game.provider}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Casino Game iFrame Modal */}
      {selectedGame && <CasinoGameModal game={selectedGame} onClose={() => setSelectedGame(null)} />}
    </section>
  );
}
