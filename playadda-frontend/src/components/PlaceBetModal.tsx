"use client";

import { useState } from "react";
import { betsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface OddsData {
  id: string; market_type: string; back_price: string; lay_price: string; liquidity: string; is_suspended: boolean;
}
interface LiveMatch {
  id: string; sport: string; tournament: string; team_a: string; team_b: string; status: string;
}

interface PlaceBetModalProps {
  match: LiveMatch;
  odds: OddsData;
  betType: "BACK" | "LAY";
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_STAKES = [100, 250, 500, 1000, 2500, 5000];

export default function PlaceBetModal({ match, odds, betType, onClose, onSuccess }: PlaceBetModalProps) {
  const { wallet } = useAuth();
  const [stake, setStake] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const oddsPrice = betType === "BACK" ? parseFloat(odds.back_price) : parseFloat(odds.lay_price);
  const stakeNum = parseFloat(stake) || 0;
  const potentialPayout = betType === "BACK" ? stakeNum * oddsPrice : stakeNum * (oddsPrice - 1);
  const profit = potentialPayout - stakeNum;
  const available = wallet?.available_balance || 0;

  const handlePlace = async () => {
    if (!stakeNum || stakeNum < 10) { toast.error("Minimum stake is ₹10"); return; }
    if (stakeNum > available) { toast.error("Insufficient balance"); return; }
    setLoading(true);
    try {
      await betsApi.place(match.id, odds.id, betType, stakeNum);
      toast.success(`Bet placed! ₹${stakeNum.toFixed(2)} on ${betType}`, { icon: "🎯" });
      onSuccess();
    } catch (err: unknown) {
      const rawMsg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(", ") : rawMsg || "Failed to place bet";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isBack = betType === "BACK";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-5 py-4 border-b border-brand-border ${isBack ? "bg-blue-500/10" : "bg-pink-500/10"}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${isBack ? "bg-blue-500/20 text-blue-300" : "bg-pink-500/20 text-pink-300"}`}>
                {betType}
              </span>
              <p className="text-white font-bold mt-1">{match.team_a} V {match.team_b}</p>
              <p className="text-sm text-brand-muted">{match.tournament}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors ml-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Odds display */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-brand-border">
            <div>
              <p className="text-xs text-brand-muted">Odds ({betType})</p>
              <p className={`text-2xl font-extrabold ${isBack ? "text-blue-300" : "text-pink-300"}`}>{oddsPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-muted">Available Balance</p>
              <p className="text-lg font-bold text-brand-lime">₹{available.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Stake Input */}
          <div>
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Stake Amount (₹)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="Enter stake..."
              className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-brand-muted focus:outline-none focus:border-brand-accent/70 transition-all text-center"
              min={10}
              max={available}
            />
          </div>

          {/* Quick stake buttons */}
          <div className="grid grid-cols-3 gap-2">
            {QUICK_STAKES.map((s) => (
              <button
                key={s}
                onClick={() => setStake(s.toString())}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${parseFloat(stake) === s ? "bg-brand-accent text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"}`}
              >
                ₹{s >= 1000 ? `${s / 1000}K` : s}
              </button>
            ))}
          </div>

          {/* Payout summary */}
          {stakeNum > 0 && (
            <div className="p-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Stake</span>
                <span className="text-white font-bold">₹{stakeNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Potential Profit</span>
                <span className="text-brand-lime font-bold">₹{profit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-brand-border pt-1.5 mt-1">
                <span className="text-white font-semibold">Total Payout</span>
                <span className="text-brand-lime font-extrabold text-base">₹{potentialPayout.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-brand-border text-gray-300 hover:bg-white/5 font-semibold text-sm transition-all">
              Cancel
            </button>
            <button
              onClick={handlePlace}
              disabled={loading || !stakeNum || stakeNum < 10 || stakeNum > available}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isBack ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20" : "bg-pink-600 hover:bg-pink-500 text-white shadow-pink-500/20"
              }`}
            >
              {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
              {loading ? "Placing..." : `Place ${betType} Bet`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
