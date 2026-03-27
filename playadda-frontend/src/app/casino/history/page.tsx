"use client";

import { useEffect, useState } from "react";
import { casinoApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface CasinoRound {
  id: string;
  game_id: string;
  game_name: string;
  provider: string;
  status: "ACTIVE" | "COMPLETED" | "CLOSED" | "EXPIRED";
  total_wagered: string;
  net_result: string;
  round_result: "WIN" | "LOSS" | "PUSH" | null;
  created_at: string;
}

function RoundRow({ r }: { r: CasinoRound }) {
  const stake = parseFloat(r.total_wagered);
  const net = parseFloat(r.net_result);
  const isWin = net > 0;
  const isLoss = net < 0;
  const isPush = net === 0 && r.status === "COMPLETED";
  const date = new Date(r.created_at);
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const gn = r.game_name.toLowerCase();
  const icon =
    gn.includes("roulette") ? "🎡" :
    gn.includes("blackjack") ? "🃏" :
    gn.includes("baccarat") ? "🎴" :
    gn.includes("dragon") ? "🐉" :
    gn.includes("andar") || gn.includes("teen") ? "🪷" :
    gn.includes("aviator") || gn.includes("crash") ? "✈️" :
    "🎰";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/2 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: isWin ? "rgba(198,255,0,0.1)" : isLoss ? "rgba(239,68,68,0.1)" : "rgba(161,161,170,0.1)" }}>
          {icon}
        </div>
        <div>
          <div className="text-white text-sm font-bold">{r.game_name}</div>
          <div className="text-gray-500 text-[10px]">{r.provider} · {dateStr} {timeStr}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-right flex-shrink-0">
        {/* Stake */}
        <div>
          <div className="text-gray-500 text-[9px] uppercase tracking-wider">Stake</div>
          <div className="text-gray-300 text-sm font-bold">₹{stake.toLocaleString("en-IN")}</div>
        </div>

        {/* Result badge */}
        {r.status === "ACTIVE" ? (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            🔄 IN PLAY
          </span>
        ) : (
          <div className="text-right">
            <div className="text-[9px] text-gray-500 uppercase tracking-wider">Net</div>
            <div className={`text-base font-black ${isWin ? "text-[#c6ff00]" : isLoss ? "text-red-400" : "text-gray-400"}`}>
              {net > 0 ? "+" : ""}₹{Math.abs(net).toLocaleString("en-IN")}
            </div>
            <div className={`text-[9px] font-black ${isWin ? "text-green-400" : isLoss ? "text-red-400" : "text-gray-400"}`}>
              {isWin ? "✅ WIN" : isLoss ? "❌ LOSS" : "🤝 PUSH"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-black" style={{ color }}>{value}</div>
    </div>
  );
}

export default function CasinoHistoryPage() {
  const { isLoggedIn, isLoading, openLogin } = useAuth();
  const router = useRouter();
  const [rounds, setRounds] = useState<CasinoRound[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "win" | "loss">("all");
  const limit = 20;

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) { openLogin(); router.push("/"); }
  }, [isLoggedIn, isLoading, openLogin, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await casinoApi.history(page, limit);
        const data = res.data?.data || res.data;
        setRounds(data.data || []);
        setTotal(data.total || 0);
      } catch {
        setRounds([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchHistory();
  }, [isLoggedIn, page]);

  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a1117" }}>
        <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completed = rounds.filter(r => r.status === "COMPLETED");
  const wins = completed.filter(r => parseFloat(r.net_result) > 0);
  const losses = completed.filter(r => parseFloat(r.net_result) < 0);
  const totalNet = completed.reduce((s, r) => s + parseFloat(r.net_result), 0);
  const totalStaked = completed.reduce((s, r) => s + parseFloat(r.total_wagered), 0);
  const winRate = completed.length > 0 ? (wins.length / completed.length) * 100 : 0;

  const filtered =
    filter === "win" ? rounds.filter(r => parseFloat(r.net_result) > 0) :
    filter === "loss" ? rounds.filter(r => parseFloat(r.net_result) < 0) :
    rounds;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen text-white" style={{ fontFamily: "Inter,system-ui,sans-serif", background: "#0a1117" }}>

      {/* Header */}
      <div className="border-b border-white/5 px-4 py-5 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</a>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white">Casino History</h1>
              <p className="text-gray-500 text-sm">Your complete game round history</p>
            </div>
            <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
              {total} rounds
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">

        {/* Summary cards */}
        {completed.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <SummaryCard
              label="Total Rounds"
              value={completed.length.toString()}
              color="#e2e8f0"
            />
            <SummaryCard
              label="Win Rate"
              value={`${winRate.toFixed(0)}%`}
              color={winRate >= 50 ? "#c6ff00" : "#f97316"}
            />
            <SummaryCard
              label="Total Staked"
              value={`₹${Math.abs(totalStaked).toLocaleString("en-IN")}`}
              color="#94a3b8"
            />
            <SummaryCard
              label="Net P&L"
              value={`${totalNet > 0 ? "+" : ""}₹${Math.abs(totalNet).toLocaleString("en-IN")}`}
              color={totalNet > 0 ? "#c6ff00" : totalNet < 0 ? "#ef4444" : "#a1a1aa"}
            />
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2 mb-4">
          {(["all", "win", "loss"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filter === f ? "text-black bg-[#c6ff00]" : "text-gray-400 border border-white/10 hover:text-white"}`}>
              {f === "all" ? "All Rounds" : f === "win" ? "✅ Wins" : "❌ Losses"}
            </button>
          ))}
        </div>

        {/* Rounds List */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🎰</div>
              <p className="text-gray-400 font-bold">No rounds yet</p>
              <p className="text-gray-600 text-sm mt-1">Start playing to see your history here</p>
              <a href="/" className="inline-block mt-4 px-6 py-2 bg-[#c6ff00] text-black font-black rounded-xl text-sm hover:bg-yellow-300 transition-colors">
                Play Now →
              </a>
            </div>
          ) : (
            filtered.map(r => <RoundRow key={r.id} r={r} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-30 bg-white/5 hover:bg-white/10 transition-colors">
              ← Prev
            </button>
            <span className="text-gray-400 text-sm font-bold">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-30 bg-white/5 hover:bg-white/10 transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
