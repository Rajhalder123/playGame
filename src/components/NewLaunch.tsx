"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";

const games = [
  { name: "Volt Run", image: "/games/game_volt_run.png" },
  { name: "Cricket Battle", image: "/games/game_cricket_battle.png" },
  { name: "Solitaire", image: "/games/game_solitaire.png" },
  { name: "Packs", image: "/games/game_packs.png" },
  { name: "Naughty Button", image: "/games/game_naughty_button.png" },
  { name: "Instant Rummy", image: "/games/game_instant_rummy.png" },
  { name: "Jhandi Munda", image: "/games/game_jhandi_munda.png" },
  { name: "Twist X", image: "/games/game_twist_x.png" },
  { name: "The Voice", image: "/games/game_the_voice.png" },
  { name: "Deal or No Deal", image: "/games/game_deal_or_no.png" },
  { name: "Snakes", image: "/games/game_snakes.png" },
  { name: "Pump", image: "/games/game_pump.png" },
];

export default function NewLaunch() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollByAmount = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 320;
    const container = scrollRef.current;

    if (direction === "right") {
      // If near the end, loop back to start
      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 10
      ) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: amount, behavior: "smooth" });
      }
    } else {
      // If at the start, loop to end
      if (container.scrollLeft <= 10) {
        container.scrollTo({
          left: container.scrollWidth,
          behavior: "smooth",
        });
      } else {
        container.scrollBy({ left: -amount, behavior: "smooth" });
      }
    }
  }, []);

  // Auto-scroll every 3 seconds
  useEffect(() => {
    const startAutoScroll = () => {
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          scrollByAmount("right");
        }
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, scrollByAmount]);

  return (
    <section className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
            New Launch
          </h2>
          <div className="w-16 h-1 bg-brand-accent rounded-full mt-2" />
        </div>

        {/* Arrow Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollByAmount("left")}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border text-white hover:bg-brand-accent hover:border-brand-accent transition-all duration-200"
            aria-label="Scroll left"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => scrollByAmount("right")}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-brand-card border border-brand-border text-white hover:bg-brand-accent hover:border-brand-accent transition-all duration-200"
            aria-label="Scroll right"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Game Cards */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
      >
        {games.map((game) => (
          <a
            key={game.name}
            href="#"
            className="group flex-shrink-0 snap-start"
          >
            <div className="relative w-[150px] h-[190px] md:w-[170px] md:h-[220px] rounded-2xl overflow-hidden border-2 border-transparent hover:border-brand-accent transition-all duration-300 shadow-lg hover:shadow-brand-accent/20">
              <Image
                src={game.image}
                alt={game.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              {/* Game name */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-bold text-white uppercase tracking-wider text-center drop-shadow-lg">
                  {game.name}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
      </div>
    </section>
  );
}
