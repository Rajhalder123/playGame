"use client";

import { useEffect, useState, useCallback } from "react";
import { oddsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import PlaceBetModal from "./PlaceBetModal";

interface OddsData {
  id: string;
  market_type: string;
  back_price: string;
  lay_price: string;
  liquidity: string;
  is_suspended: boolean;
}

interface LiveMatch {
  id: string;
  sport: string;
  tournament: string;
  team_a: string;
  team_b: string;
  status: string;
  scheduled_at: string;
  odds: OddsData[];
}

const sportIcons: Record<string, string> = {
  CRICKET: "🏏", FOOTBALL: "⚽", TENNIS: "🎾",
  BASKETBALL: "🏀", KABADDI: "🤼", HORSE_RACE: "🏇", OTHER: "🎮"
};

// Static fallback uses valid UUIDs but is marked demo-only so bets are blocked
const STATIC_MATCH_IDS = new Set([
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "c3d4e5f6-a7b8-9012-cdef-123456789012",
]);
const staticFallback: LiveMatch[] = [
  { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", sport: "TENNIS", tournament: "ATP Indian Wells 2026", team_a: "Hijikata", team_b: "Norrie", status: "LIVE", scheduled_at: new Date().toISOString(), odds: [{ id: "d4e5f6a7-b8c9-0123-defa-234567890123", market_type: "MATCH_ODDS", back_price: "1.04", lay_price: "1.05", liquidity: "12000", is_suspended: false }] },
  { id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", sport: "FOOTBALL", tournament: "UEFA Champions League", team_a: "Leverkusen", team_b: "Arsenal", status: "LIVE", scheduled_at: new Date().toISOString(), odds: [{ id: "e5f6a7b8-c9d0-1234-efab-345678901234", market_type: "MATCH_ODDS", back_price: "1.45", lay_price: "1.50", liquidity: "80000", is_suspended: false }] },
  { id: "c3d4e5f6-a7b8-9012-cdef-123456789012", sport: "CRICKET", tournament: "IPL 2026", team_a: "Mumbai Indians", team_b: "CSK", status: "UPCOMING", scheduled_at: new Date(Date.now() + 3600000).toISOString(), odds: [{ id: "f6a7b8c9-d0e1-2345-fabc-456789012345", market_type: "MATCH_ODDS", back_price: "1.85", lay_price: "1.95", liquidity: "50000", is_suspended: false }] },
];

export default function TopMatches() {
  const { isLoggedIn, openLogin, refreshWallet } = useAuth();
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [betTarget, setBetTarget] = useState<{
    match: LiveMatch; odds: OddsData; type: "BACK" | "LAY";
  } | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await oddsApi.live();
      const data: LiveMatch[] = res.data?.data || res.data || [];
      setMatches(data.length > 0 ? data : staticFallback);
    } catch {
      setMatches(staticFallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchLive]);

  const handleOddsClick = (match: LiveMatch, odds: OddsData, type: "BACK" | "LAY") => {
    if (!isLoggedIn) { openLogin(); return; }
    if (odds.is_suspended) return;
    if (STATIC_MATCH_IDS.has(match.id)) {
      import("react-hot-toast").then(({ default: toast }) =>
        toast.error("Live odds not available right now. Please try again shortly.", { icon: "⏳" })
      );
      return;
    }
    setBetTarget({ match, odds, type });
  };

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 3600000 && diff > 0) return `${Math.ceil(diff / 60000)}m`;
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-8 bg-brand-lime rounded-full" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
          Top Matches
        </h2>
        {loading && (
          <svg className="animate-spin w-5 h-5 text-brand-accent ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
        {matches.map((match) => {
          const odds = match.odds?.[0];
          const isLive = match.status === "LIVE";
          return (
            <div key={match.id} className="min-w-[300px] md:min-w-[320px] bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-accent/40 transition-all duration-300 group flex-shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-brand-surface/50 border-b border-brand-border">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sportIcons[match.sport] || "🎮"}</span>
                  <span className="text-xs font-bold text-brand-lime uppercase tracking-wider">{match.sport}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-brand-accent/20 text-brand-lime rounded-md">MO</span>
                  {isLive && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 rounded-md text-[10px] font-bold text-red-400 uppercase">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-brand-accent font-semibold">{match.tournament}</p>
                  <p className="text-sm font-bold text-white mt-1">{match.team_a} V {match.team_b}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-brand-muted">{fmtDate(match.scheduled_at)}</span>
                  </div>
                </div>

                {/* Odds Buttons */}
                {odds ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOddsClick(match, odds, "BACK")}
                      disabled={odds.is_suspended}
                      className="py-2.5 px-3 rounded-xl text-center transition-all duration-200 bg-blue-500/20 hover:bg-blue-500/35 text-blue-300 border border-blue-500/20 hover:border-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                    >
                      <span className="text-[10px] text-gray-500 block">BACK</span>
                      <span className="text-sm font-bold block">{odds.back_price}</span>
                      <span className="text-[9px] text-gray-500 block">{(parseFloat(odds.liquidity) / 1000).toFixed(0)}K</span>
                    </button>
                    <button
                      onClick={() => handleOddsClick(match, odds, "LAY")}
                      disabled={odds.is_suspended}
                      className="py-2.5 px-3 rounded-xl text-center transition-all duration-200 bg-pink-500/20 hover:bg-pink-500/35 text-pink-300 border border-pink-500/20 hover:border-pink-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-[10px] text-gray-500 block">LAY</span>
                      <span className="text-sm font-bold block">{odds.lay_price}</span>
                      <span className="text-[9px] text-gray-500 block">{(parseFloat(odds.liquidity) / 1000).toFixed(0)}K</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-3 text-center text-sm text-brand-muted">No odds available</div>
                )}

                {odds?.is_suspended && (
                  <div className="py-1.5 text-center text-xs font-bold text-yellow-400 bg-yellow-500/10 rounded-lg">
                    🔒 Market Suspended
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Place Bet Modal */}
      {betTarget && (
        <PlaceBetModal
          match={betTarget.match}
          odds={betTarget.odds}
          betType={betTarget.type}
          onClose={() => setBetTarget(null)}
          onSuccess={() => { setBetTarget(null); refreshWallet(); }}
        />
      )}
    </section>
  );
}
