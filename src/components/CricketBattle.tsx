import Image from "next/image";

export default function CricketBattle() {
  return (
    <section className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-8 bg-brand-gold rounded-full" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
          Cricket Battle
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl min-h-[200px] md:min-h-[280px] group cursor-pointer">
        <Image
          src="/cricket-battle.png"
          alt="Cricket Battle"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-transparent to-brand-dark/30" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🏏</span>
            <span className="text-4xl">⭐</span>
            <span className="text-4xl">🏏</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            Enter the <span className="text-gradient-gold">Battle Arena</span>
          </h3>
          <p className="text-sm text-gray-300 mb-4 max-w-md">
            Predict match outcomes, compete with others, and win exciting rewards
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-gold text-black text-sm font-bold rounded-xl hover:bg-brand-yellow transition-all duration-300 shadow-lg shadow-brand-gold/30"
          >
            Play Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
      </div>
    </section>
  );
}
