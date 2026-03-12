"use client";

import { useState } from "react";

const navLinks = [
  { name: "Home", href: "#", active: true },
  { name: "Inplay", href: "#" },
  { name: "Sportsbook", href: "#" },
  { name: "Casino", href: "#" },
  { name: "Multi Markets", href: "#" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-brand-darker/95 backdrop-blur-md border-b border-brand-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-lime to-brand-accent rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
              <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Play <span className="text-brand-lime">Adda</span>
          </span>
        </div>

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
          {/* Support Icon */}
          <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-brand-accent/20 text-brand-lime hover:bg-brand-accent/30 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>

          {/* Login Button */}
          <a
            href="#"
            className="hidden sm:inline-flex px-5 py-2 rounded-full border border-brand-accent text-brand-accent text-sm font-semibold hover:bg-brand-accent hover:text-white transition-all duration-200"
          >
            Login
          </a>

          {/* Signup Button */}
          <a
            href="#"
            className="hidden sm:inline-flex px-5 py-2 rounded-full bg-brand-accent text-white text-sm font-semibold hover:bg-brand-green-light transition-all duration-200 shadow-lg shadow-brand-accent/20"
          >
            Signup
          </a>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                mobileMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? "max-h-96 border-t border-brand-border" : "max-h-0"
        }`}
      >
        <div className="p-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                link.active
                  ? "bg-brand-accent text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.name}
            </a>
          ))}
          <div className="flex gap-3 pt-3 border-t border-brand-border">
            <a
              href="#"
              className="flex-1 text-center px-4 py-3 rounded-xl border border-brand-accent text-brand-accent text-sm font-semibold hover:bg-brand-accent hover:text-white transition-all"
            >
              Login
            </a>
            <a
              href="#"
              className="flex-1 text-center px-4 py-3 rounded-xl bg-brand-accent text-white text-sm font-semibold hover:bg-brand-green-light transition-all"
            >
              Signup
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
