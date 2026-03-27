"use client";

import { useState, useEffect } from "react";
import { walletApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  balance_before: string;
  balance_after: string;
  note: string | null;
  created_at: string;
}

const txColors: Record<string, string> = {
  DEPOSIT: "text-green-400", WITHDRAW: "text-red-400",
  BET_LOCK: "text-yellow-400", BET_WIN: "text-green-400",
  BET_LOSS: "text-red-400", BET_VOID: "text-gray-400",
  REFERRAL_BONUS: "text-brand-lime",
};
const txIcons: Record<string, string> = {
  DEPOSIT: "⬇️", WITHDRAW: "⬆️", BET_LOCK: "🔒",
  BET_WIN: "🏆", BET_LOSS: "💔", BET_VOID: "↩️", REFERRAL_BONUS: "🎁",
};

export default function WalletPage() {
  const { user, wallet, isLoggedIn, refreshWallet, openLogin } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  useEffect(() => {
    if (!isLoggedIn) { openLogin(); return; }
    fetchTx();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const fetchTx = async () => {
    setTxLoading(true);
    try {
      const res = await walletApi.transactions(1, 30);
      const d = res.data?.data || res.data;
      setTransactions(Array.isArray(d) ? d : d?.data || []);
    } catch { /* ignore */ }
    finally { setTxLoading(false); }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error("Enter a valid amount"); return; }
    setLoading(true);
    try {
      if (tab === "deposit") {
        await walletApi.deposit(num);
        toast.success(`₹${num.toFixed(2)} deposited!`, { icon: "💚" });
      } else {
        await walletApi.withdraw(num);
        toast.success(`₹${num.toFixed(2)} withdrawn!`, { icon: "✅" });
      }
      setAmount("");
      await refreshWallet();
      await fetchTx();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Transaction failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  const available = wallet?.available_balance || 0;
  const balance = wallet?.balance || 0;
  const locked = wallet?.locked_balance || 0;

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <p className="text-brand-muted text-sm">Welcome back,</p>
          <h1 className="text-3xl font-extrabold text-white">{user?.username}&apos;s Wallet</h1>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Balance", value: balance, color: "text-white" },
            { label: "Available", value: available, color: "text-brand-lime" },
            { label: "In Bets (Locked)", value: locked, color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-brand-card border border-brand-border rounded-2xl p-4">
              <p className="text-xs text-brand-muted uppercase tracking-wider">{label}</p>
              <p className={`text-xl font-extrabold mt-1 ${color}`}>
                ₹{value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>

        {/* Deposit / Withdraw */}
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-brand-border">
            {(["deposit", "withdraw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-bold uppercase tracking-wide transition-all ${tab === t ? "bg-brand-accent text-white" : "text-gray-400 hover:text-white"}`}
              >
                {t === "deposit" ? "⬇️ Deposit" : "⬆️ Withdraw"}
              </button>
            ))}
          </div>
          <form onSubmit={handleAction} className="p-5 space-y-4">
            <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={tab === "deposit" ? "How much to deposit?" : "How much to withdraw?"}
              className="w-full bg-white/5 border border-brand-border rounded-xl px-4 py-3 text-white text-lg font-bold placeholder-brand-muted focus:outline-none focus:border-brand-accent/70 transition-all"
              min={10}
            />
            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap">
              {[100, 500, 1000, 5000, 10000].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(v.toString())}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${amount === v.toString() ? "bg-brand-accent border-brand-accent text-white" : "border-brand-border text-gray-400 hover:text-white hover:border-brand-accent/50"}`}
                >
                  ₹{v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-accent hover:bg-brand-green-light text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-accent/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>}
              {loading ? "Processing..." : tab === "deposit" ? "Deposit Now" : "Withdraw Now"}
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="text-white font-bold">Transaction History</h3>
            <button onClick={fetchTx} className="text-brand-muted hover:text-white text-xs transition-colors">Refresh ↻</button>
          </div>
          {txLoading ? (
            <div className="py-12 text-center">
              <svg className="animate-spin w-8 h-8 text-brand-accent mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-brand-muted">No transactions yet</div>
          ) : (
            <div className="divide-y divide-brand-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{txIcons[tx.type] || "💫"}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{tx.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-brand-muted">{tx.note || new Date(tx.created_at).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${txColors[tx.type] || "text-white"}`}>
                      {["WITHDRAW", "BET_LOCK", "BET_LOSS"].includes(tx.type) ? "-" : "+"}₹{parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-brand-muted">Bal: ₹{parseFloat(tx.balance_after).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
