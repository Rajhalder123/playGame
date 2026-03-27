"use client";

import { useState, useEffect, useCallback } from "react";
import { casinoApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface Game {
  id: string; name: string; category: string; provider: string; thumbnail: string;
  isHot: boolean; minBet: number; maxBet: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Live Casino": "🎰", "Indian Games": "🃏", "Crash Games": "✈️", "Slots": "🎳"
};

function GameModal({ game, onClose, isDemo, token }: {
  game: Game; onClose: () => void; isDemo: boolean; token: string | null;
}) {
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const { wallet } = useAuth();

  const launch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDemo) {
        // Guest/Demo: go straight to frontend demo page with local balance
        const frontendBase = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";
        const demoToken = "DEMO_" + game.id.replace(/-/g, "").toUpperCase();
        const url = `${frontendBase}/casino/demo/${demoToken}?game=${game.id}&name=${encodeURIComponent(game.name)}&provider=${encodeURIComponent(game.provider)}&isDemo=true`;
        setLaunchUrl(url);
      } else {
        // Real mode: call backend to create a session
        const res = await casinoApi.launch(game.id, "web");
        const data = res.data?.data || res.data;
        let url = data?.launch_url || data;
        if (!url || typeof url !== "string") throw new Error("No launch URL received");
        // Append auth mode params so the demo page knows it's real
        url += `&isDemo=false`;
        setLaunchUrl(url);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to launch game";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [game.id, game.name, game.provider, isDemo]);

  useEffect(() => { void launch(); }, [launch]);

  const icon = CATEGORY_ICONS[game.category] || "🎮";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative bg-brand-darker border border-brand-border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${fullscreen ? "w-full h-full rounded-none" : "w-full max-w-4xl"}`}
        style={{ height: fullscreen ? "100%" : "82vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-surface/80 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{game.name}</p>
              <p className="text-brand-muted text-[10px]">{game.provider} · {game.category}</p>
            </div>

            {/* Mode badge */}
            {isDemo ? (
              <span className="text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full uppercase">
                🎮 DEMO
              </span>
            ) : (
              <span className="text-[9px] font-black bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                💵 REAL
                {wallet && <span className="text-green-300">· ₹{Math.floor(wallet.available_balance).toLocaleString("en-IN")}</span>}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="w-full bg-brand-darker" style={{ height: "calc(100% - 57px)" }}>
          {loading && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-4xl">{icon}</div>
                <div className="absolute inset-0 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">Launching {game.name}</p>
                <p className="text-brand-muted text-sm mt-1">{isDemo ? "Starting demo…" : `Connecting to ${game.provider}…`}</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
              <span className="text-5xl">⚠️</span>
              <p className="text-white font-bold text-lg text-center">Failed to launch {game.name}</p>
              <p className="text-red-400 text-sm text-center max-w-sm">{error}</p>
              <button onClick={() => void launch()} className="px-6 py-2.5 bg-brand-accent hover:bg-brand-green-light text-white font-bold rounded-xl transition-all">
                🔄 Try Again
              </button>
              <button onClick={onClose} className="text-brand-muted hover:text-white text-sm transition-colors">Close</button>
            </div>
          )}

          {launchUrl && !loading && (
            <iframe
              src={launchUrl}
              className="w-full h-full border-0 block"
              allow="fullscreen; autoplay"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              title={game.name}
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CasinoGameModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const { isLoggedIn, token } = useAuth();
  // Allow both demo (guest) and real (logged-in) play — no forced login redirect
  return <GameModal game={game} onClose={onClose} isDemo={!isLoggedIn} token={token} />;
}

export type { Game };
