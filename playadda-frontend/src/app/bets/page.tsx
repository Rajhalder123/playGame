"use client";

import { useState, useEffect } from "react";
import { betsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Bet {
  id: string;
  bet_type: "BACK" | "LAY";
  stake: string;
  potential_payout: string;
  odds_price: string;
  status: "PENDING" | "WON" | "LOST" | "VOID";
  market_type: string;
  created_at: string;
  settled_at: string | null;
  settlement_note: string | null;
  match?: { team_a: string; team_b: string; tournament: string; sport: string };
}

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  WON: "text-green-400 bg-green-500/10 border-green-500/20",
  LOST: "text-red-400 bg-red-500/10 border-red-500/20",
  VOID: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};
const statusIcons: Record<string, string> = { PENDING: "⏳", WON: "🏆", LOST: "💔", VOID: "↩️" };
const sportIcons: Record<string, string> = { CRICKET: "🏏", FOOTBALL: "⚽", TENNIS: "🎾", BASKETBALL: "🏀", KABADDI: "🤼", HORSE_RACE: "🏇" };

export default function BetsPage() {
  const { isLoggedIn, openLogin } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) { openLogin(); return; }
    fetchBets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, filter]);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const status = filter !== "ALL" ? filter : undefined;
      const res = await betsApi.history(1, 50, status);
      const d = res.data?.data || res.data;
      setBets(Array.isArray(d) ? d : d?.data || []);
      setTotal(d?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (!isLoggedIn) return null;

  const tabs = ["ALL", "PENDING", "WON", "LOST", "VOID"];
  const stats = {
    total: bets.length,
    won: bets.filter((b) => b.status === "WON").length,
    pending: bets.filter((b) => b.status === "PENDING").length,
    totalWon: bets.filter((b) => b.status === "WON").reduce((s, b) => s + parseFloat(b.potential_payout), 0),
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">My Bets</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Bets", value: stats.total },
            { label: "Won", value: stats.won, color: "text-green-400" },
            { label: "Pending", value: stats.pending, color: "text-yellow-400" },
            { label: "Won ₹", value: `${stats.totalWon.toFixed(0)}`, color: "text-brand-lime" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-3 text-center">
              <p className="text-xs text-brand-muted uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-extrabold mt-1 ${color || "text-white"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${filter === t ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" : "bg-brand-card border border-brand-border text-gray-400 hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Bet List */}
        {loading ? (
          <div className="py-16 text-center">
            <svg className="animate-spin w-10 h-10 text-brand-accent mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
        ) : bets.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-5xl">🎯</p>
            <p className="text-white font-bold text-xl">No bets {filter !== "ALL" ? `with status ${filter}` : "yet"}</p>
            <p className="text-brand-muted text-sm">Place your first bet on the home page!</p>
            <a href="/" className="inline-block mt-2 px-5 py-2.5 bg-brand-accent text-white rounded-full text-sm font-bold hover:bg-brand-green-light transition-all">
              Browse Matches
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => {
              const isBack = bet.bet_type === "BACK";
              const stake = parseFloat(bet.stake);
              const payout = parseFloat(bet.potential_payout);
              return (
                <div key={bet.id} className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-surface/50">
                    <div className="flex items-center gap-2">
                      <span>{sportIcons[bet.match?.sport || ""] || "🎮"}</span>
                      <span className="text-xs font-bold text-brand-muted">{bet.match?.tournament || "—"}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isBack ? "bg-blue-500/20 text-blue-300" : "bg-pink-500/20 text-pink-300"}`}>{bet.bet_type}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusColors[bet.status]}`}>
                      {statusIcons[bet.status]} {bet.status}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-brand-muted">Match</p>
                      <p className="text-sm font-bold text-white">{bet.match ? `${bet.match.team_a} v ${bet.match.team_b}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted">Odds @ {parseFloat(bet.odds_price).toFixed(2)}</p>
                      <p className="text-sm font-bold text-white">{bet.market_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted">Stake</p>
                      <p className="text-sm font-bold text-white">₹{stake.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted">Potential Payout</p>
                      <p className="text-sm font-bold text-brand-lime">₹{payout.toFixed(2)}</p>
                    </div>
                    {bet.settled_at && (
                      <div className="col-span-2">
                        <p className="text-xs text-brand-muted">{bet.settlement_note}</p>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-brand-border bg-brand-surface/30">
                    <p className="text-xs text-brand-muted">{new Date(bet.created_at).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              );
            })}
            {total > bets.length && (
              <p className="text-center text-sm text-brand-muted py-2">Showing {bets.length} of {total} bets</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
