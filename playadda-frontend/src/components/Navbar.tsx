"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { name: "Home", href: "/", active: true },
  { name: "Inplay", href: "#" },
  { name: "Sportsbook", href: "#" },
  { name: "Casino", href: "#" },
  { name: "Multi Markets", href: "#" },
];

export default function Navbar() {
  const { user, wallet, isLoggedIn, logout, openLogin, openRegister, refreshWallet } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Auto-refresh wallet every 30 seconds
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(refreshWallet, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, refreshWallet]);

  return (
    <nav className="sticky top-0 z-50 bg-brand-darker/95 backdrop-blur-md border-b border-brand-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-lime to-brand-accent rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
              <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Play <span className="text-brand-lime">Adda</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 bg-brand-nav/60 rounded-full px-2 py-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                link.active
                  ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/30"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Wallet Balance */}
              <a
                href="/wallet"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/20 border border-brand-accent/30 hover:bg-brand-accent/30 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-lime">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                </svg>
                <span className="text-sm font-bold text-brand-lime">
                  ₹{wallet ? wallet.available_balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
                </span>
              </a>

              {/* Deposit Button */}
              <a
                href="/wallet"
                className="hidden sm:inline-flex px-4 py-2 rounded-full bg-brand-accent text-white text-sm font-bold hover:bg-brand-green-light transition-all duration-200 shadow-lg shadow-brand-accent/20"
              >
                + Deposit
              </a>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full bg-brand-surface border border-brand-border hover:border-brand-accent/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-accent to-brand-green flex items-center justify-center text-white text-sm font-bold">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-brand-surface border border-brand-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-brand-border">
                      <p className="text-white font-bold text-sm">{user?.username}</p>
                      <p className="text-brand-muted text-xs truncate">{user?.email}</p>
                      {user?.role === "ADMIN" && (
                        <span className="inline-block mt-1 text-[10px] bg-brand-accent/20 text-brand-lime px-2 py-0.5 rounded-full font-bold uppercase">Admin</span>
                      )}
                    </div>
                    <div className="py-1">
                      <a href="/wallet" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors" onClick={() => setUserMenuOpen(false)}>
                        💳 My Wallet
                      </a>
                      <a href="/bets" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors" onClick={() => setUserMenuOpen(false)}>
                        🎯 My Bets
                      </a>
                    </div>
                    <div className="border-t border-brand-border py-1">
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-brand-accent/20 text-brand-lime hover:bg-brand-accent/30 transition-colors"
                onClick={() => {}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button
                onClick={openLogin}
                className="hidden sm:inline-flex px-5 py-2 rounded-full border border-brand-accent text-brand-accent text-sm font-semibold hover:bg-brand-accent hover:text-white transition-all duration-200"
              >
                Login
              </button>
              <button
                onClick={openRegister}
                className="hidden sm:inline-flex px-5 py-2 rounded-full bg-brand-accent text-white text-sm font-semibold hover:bg-brand-green-light transition-all duration-200 shadow-lg shadow-brand-accent/20"
              >
                Signup
              </button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-96 border-t border-brand-border" : "max-h-0"}`}>
        <div className="p-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                link.active ? "bg-brand-accent text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.name}
            </a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-brand-border">
            {isLoggedIn ? (
              <>
                <a href="/wallet" className="flex-1 text-center px-4 py-3 rounded-xl bg-brand-accent/20 text-brand-lime text-sm font-semibold">
                  ₹{wallet ? wallet.available_balance.toFixed(2) : "---"}
                </a>
                <button onClick={logout} className="flex-1 text-center px-4 py-3 rounded-xl border border-red-500/50 text-red-400 text-sm font-semibold">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={openLogin} className="flex-1 text-center px-4 py-3 rounded-xl border border-brand-accent text-brand-accent text-sm font-semibold hover:bg-brand-accent hover:text-white transition-all">Login</button>
                <button onClick={openRegister} className="flex-1 text-center px-4 py-3 rounded-xl bg-brand-accent text-white text-sm font-semibold hover:bg-brand-green-light transition-all">Signup</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Click-outside to close user menu */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </nav>
  );
}
