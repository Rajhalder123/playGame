"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/* ─── Per-card animated overlay components ─── */

const AviatorOverlay = () => (
  <>
    {/* Clouds streaking past */}
    <motion.div animate={{ x: ["100%", "-200%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute top-[15%] w-[40%] h-6 bg-white/30 rounded-full blur-lg z-10" />
    <motion.div animate={{ x: ["120%", "-220%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute top-[45%] w-[30%] h-4 bg-white/20 rounded-full blur-md z-10" />
    <motion.div animate={{ x: ["80%", "-180%"] }} transition={{ duration: 3.5, repeat: Infinity, ease: "linear", delay: 0.5 }} className="absolute top-[70%] w-[35%] h-5 bg-white/25 rounded-full blur-lg z-10" />

    {/* Floating dollar signs */}
    <motion.span animate={{ y: [20, -60], x: [0, 15], opacity: [0, 1, 0], rotate: [0, 25] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }} className="absolute top-[30%] left-[15%] text-green-300 text-3xl font-black drop-shadow-lg z-10">$</motion.span>
    <motion.span animate={{ y: [30, -50], x: [0, -10], opacity: [0, 1, 0], rotate: [0, -20] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.8 }} className="absolute top-[50%] right-[20%] text-green-300 text-4xl font-black drop-shadow-lg z-10">$</motion.span>
    <motion.span animate={{ y: [10, -70], opacity: [0, 1, 0], rotate: [0, 15] }} transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }} className="absolute top-[40%] left-[50%] text-green-200 text-2xl font-black drop-shadow-lg z-10">$</motion.span>

  </>
);

const MarbleOverlay = () => (
  <>
    {/* Bouncing marbles */}
    <motion.div animate={{ y: [-10, 20, -10], x: [0, 15, 0], rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] left-[20%] w-14 h-14 rounded-full bg-gradient-to-br from-yellow-200/80 to-yellow-500/80 border-2 border-yellow-300/60 shadow-[0_0_25px_rgba(253,224,71,0.6)] z-10" />
    <motion.div animate={{ y: [15, -20, 15], x: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute top-[40%] right-[25%] w-11 h-11 rounded-full bg-gradient-to-br from-blue-300/80 to-blue-600/80 shadow-[0_0_25px_rgba(59,130,246,0.6)] z-10" />
    <motion.div animate={{ y: [0, -25, 0], x: [-5, 10, -5] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[30%] left-[45%] w-10 h-10 rounded-full bg-gradient-to-br from-red-300/80 to-red-600/80 shadow-[0_0_25px_rgba(239,68,68,0.6)] z-10" />

    {/* Neon pulse glow */}
    <motion.div animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent z-5" />
  </>
);

const ChickenOverlay = () => (
  <>
    {/* Bouncing golden eggs */}
    <motion.div animate={{ y: [0, -20, 0], rotate: [0, 15, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[18%] left-[15%] w-6 h-9 bg-gradient-to-b from-yellow-200 to-yellow-500 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[0_0_20px_rgba(250,204,21,0.6)] z-10" />
    <motion.div animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="absolute bottom-[22%] right-[30%] w-5 h-7 bg-gradient-to-b from-yellow-100 to-yellow-400 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[0_0_15px_rgba(250,204,21,0.5)] z-10" />
  </>
);

const ColorPredictionOverlay = () => (
  <>
    {/* Spinning sparkles */}
    {[
      { x: "15%", y: "20%", d: 1.5, dl: 0 },
      { x: "80%", y: "15%", d: 2.0, dl: 0.3 },
      { x: "25%", y: "75%", d: 1.8, dl: 0.6 },
      { x: "70%", y: "65%", d: 2.2, dl: 0.9 },
      { x: "50%", y: "30%", d: 1.4, dl: 1.2 },
      { x: "40%", y: "85%", d: 2.5, dl: 0.2 },
    ].map((s, i) => (
      <motion.div key={i} animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], rotate: [0, 180] }} transition={{ duration: s.d, repeat: Infinity, delay: s.dl }} className="absolute w-3 h-3 z-10" style={{ left: s.x, top: s.y }}>
        <div className="w-full h-full bg-yellow-300 rounded-full shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
      </motion.div>
    ))}

    {/* Floating poker chips */}
    <motion.div animate={{ y: [-10, 15, -10], rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] right-[15%] w-10 h-10 rounded-full border-4 border-dashed border-green-400/60 bg-green-600/40 shadow-[0_0_15px_rgba(34,197,94,0.5)] z-10" />
    <motion.div animate={{ y: [10, -15, 10], rotate: [0, -360] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-[25%] left-[12%] w-8 h-8 rounded-full border-4 border-dashed border-blue-400/60 bg-blue-600/40 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10" />
  </>
);

const LivePredictionOverlay = () => (
  <>
    {/* Animated line chart drawing across */}
    <svg className="absolute inset-0 w-full h-full z-10" preserveAspectRatio="none">
      <motion.path
        animate={{ pathLength: [0, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        d="M 0 120 L 60 80 L 120 140 L 180 60 L 240 100 L 320 30 L 400 70 L 500 20"
        fill="none" stroke="#22c55e" strokeWidth="4"
        className="drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]"
      />
      <motion.path
        animate={{ pathLength: [0, 1], opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        d="M 0 80 L 70 120 L 140 50 L 210 90 L 280 30 L 380 70 L 500 10"
        fill="none" stroke="#ef4444" strokeWidth="3"
        className="drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
      />
    </svg>

    {/* Pulsing green/red candle dots */}
    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute top-[25%] left-[30%] w-4 h-4 bg-green-400 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.8)] z-10" />
    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }} className="absolute top-[45%] right-[25%] w-3 h-3 bg-red-400 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10" />

    {/* Spinning 24/7 badge */}
    <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-[10%] right-[8%] w-16 h-16 rounded-full border-2 border-yellow-500 flex items-center justify-center text-yellow-400 font-black bg-slate-900/80 shadow-[0_0_25px_rgba(250,204,21,0.5)] z-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-yellow-200" />
      <span className="text-sm z-10">24/7</span>
    </motion.div>
  </>
);

const MinesOverlay = () => (
  <>
    {/* Floating spinning diamonds */}
    <motion.div animate={{ y: [-15, 20, -15], rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[12%] w-12 h-12 bg-gradient-to-br from-cyan-200/70 to-cyan-500/70 rotate-45 border border-white/40 shadow-[0_0_30px_rgba(34,211,238,0.8)] z-10" />
    <motion.div animate={{ y: [20, -20, 20], rotate: [0, -180, -360] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-[20%] right-[15%] w-16 h-16 bg-gradient-to-br from-blue-200/70 to-blue-500/70 rotate-45 border border-white/40 shadow-[0_0_40px_rgba(59,130,246,0.8)] z-10" />
    <motion.div animate={{ y: [-10, 15, -10], rotate: [45, 225, 405] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[50%] right-[40%] w-8 h-8 bg-gradient-to-br from-cyan-300/60 to-blue-400/60 rotate-45 border border-white/30 shadow-[0_0_20px_rgba(34,211,238,0.6)] z-10" />

    {/* Fuse spark traveling */}
    <motion.div animate={{ x: ["70%", "30%", "70%"], y: ["15%", "40%", "15%"], scale: [0.8, 1.5, 0.8] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="absolute w-5 h-5 rounded-full bg-white shadow-[0_0_25px_#67e8f9,0_0_50px_#22d3ee] z-20" />

    {/* Blue starburst pulse */}
    <motion.div animate={{ opacity: [0.05, 0.2, 0.05], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-cyan-400/10 z-5" />
  </>
);

/* ─── Game Data ─── */

const games = [
  { id: 1, title: "AVIATOR", image: "/trending/aviator.png", Overlay: AviatorOverlay, glowColor: "rgba(239,68,68,0.5)" },
  { id: 2, title: "MARBLE RUN", image: "/trending/marble_run.png", Overlay: MarbleOverlay, glowColor: "rgba(168,85,247,0.5)" },
  { id: 3, title: "CHICKEN GAMES", image: "/trending/chicken.png", Overlay: ChickenOverlay, glowColor: "rgba(245,158,11,0.5)" },
  { id: 4, title: "COLOR PREDICTION", image: "/trending/color_prediction.png", Overlay: ColorPredictionOverlay, glowColor: "rgba(220,38,38,0.5)" },
  { id: 5, title: "LIVE PREDICTION", image: "/trending/live_prediction.png", Overlay: LivePredictionOverlay, glowColor: "rgba(34,197,94,0.5)" },
  { id: 6, title: "MINES", image: "/trending/mines.png", Overlay: MinesOverlay, glowColor: "rgba(59,130,246,0.5)" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 90, damping: 18 } },
};

export default function TradingGames() {
  return (
    <section className="bg-brand-sidebar border-t border-brand-green/30 pt-4 pb-8 relative overflow-hidden">
      <div className="absolute top-[-50%] left-[-20%] w-[60%] h-[200%] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-50%] right-[-20%] w-[60%] h-[200%] bg-brand-lime/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 relative z-10">
        <div className="flex items-center gap-3 mb-6 bg-brand-green/20 px-4 py-2 border-l-4 border-white">
          <h2 className="text-xl md:text-2xl font-black text-white italic tracking-wide uppercase">
            TRENDING GAMES
          </h2>
          <span className="relative flex h-3 w-3 ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-lime" />
          </span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {games.map((game) => (
            <motion.div
              key={game.id}
              variants={itemVariants}
              className="relative rounded-2xl md:rounded-3xl overflow-hidden group cursor-pointer border-2 border-white/10 hover:border-brand-lime/80 transition-all duration-500"
              style={{ boxShadow: `0 8px 32px ${game.glowColor.replace("0.5", "0.15")}` }}
              whileHover={{ boxShadow: `0 12px 48px ${game.glowColor}` }}
            >
              {/* Static AI Image Background */}
              <div className="relative w-full pb-[60%] md:pb-[55%] overflow-hidden">
                <Image
                  src={game.image}
                  alt={game.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={game.id <= 3}
                />

                {/* Live animated overlay specific to this game */}
                <game.Overlay />
              </div>

              {/* Title */}
              <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-5 pt-12 pb-4">
                <h3 className="text-white font-black text-xl md:text-2xl italic tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,1)] text-center uppercase">
                  {game.title}
                </h3>
              </div>

              {/* Hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500 flex items-center justify-center z-30">
                <button className="px-8 py-3 bg-gradient-to-r from-brand-lime to-brand-accent text-black font-black uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(198,255,0,0.6)] opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 text-sm hover:shadow-[0_0_50px_rgba(198,255,0,0.9)] hover:scale-105">
                  ▶ Play Now
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
