"use client";

import { useState } from "react";
const sportsCategories = [
  { name: "Cricket", icon: "🏏", color: "#84cc16" }, // Original f44336
  { name: "Football", icon: "⚽", color: "#3b82f6" }, // Original 4caf50
  { name: "Tennis", icon: "🎾", color: "#eab308" }, // Original ffeb3b
  { name: "Kabaddi", icon: "🤼", color: "#f97316" }, // Original ff9800
  { name: "Basketball", icon: "🏀", color: "#ef4444" }, // Original ff5722
  { name: "Baseball", icon: "⚾", color: "#a855f7" }, // Original e91e63
  { name: "GreyHound", icon: "🐕", color: "#d946ef" }, // Original 9c27b0
  { name: "Horse Race", icon: "🏇", color: "#8b5cf6" }, // Original 673ab7
  { name: "Volleyball", icon: "🏐", color: "#6366f1" }, // Original 2196f3
  { name: "Darts", icon: "🎯", color: "#0ea5e9" }, // Original 00bcd4
  { name: "Futsal", icon: "⚽", color: "#14b8a6" }, // Original 009688
  { name: "Table Tennis", icon: "🏓", color: "#22c55e" }, // Original 8bc34a
  { name: "Binary", icon: "📊", color: "#64748b" }, // Original 607d8b
  { name: "Politics", icon: "🏛️", color: "#b45309" }, // Original 795548
  { name: "Ice Hockey", icon: "🏒", color: "#38bdf8" }, // Original 03a9f4
  { name: "MMA", icon: "🥊", color: "#ef4444" }, // Original d32f2f
  { name: "Rugby", icon: "🏉", color: "#d946ef" }, // Original 7b1fa2
  { name: "Multi Markets", icon: "📈", color: "#3b82f6" }, // Original 1976d2
];

const otherMenu = [
  { name: "Promotions", icon: "🎁", color: "#ec4899" },
  { name: "My Transaction", icon: "💳", color: "#0ea5e9" },
  { name: "Game Rules", icon: "📋", color: "#22c55e" },
  { name: "Language : EN", icon: "🌐", color: "#8b5cf6" },
];

const securityMenu = [
  { name: "Terms & Policy", icon: "🔒", color: "#64748b" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Cricket");

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-brand-accent rounded-full shadow-lg shadow-brand-accent/30 flex items-center justify-center text-white hover:bg-brand-green-light transition-all"
        aria-label="Toggle sports menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 lg:z-auto
          w-[200px] lg:w-[180px] h-screen
          bg-brand-sidebar border-r border-brand-border
          flex flex-col
          transition-transform duration-300 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          overflow-y-auto scrollbar-hide
        `}
      >
        {/* Sports List */}
        <div className="flex-1 py-2">
          {sportsCategories.map((sport) => (
            <button
              key={sport.name}
              onClick={() => {
                setActiveCategory(sport.name);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-sm font-medium
                transition-all duration-300 group relative
                ${
                  activeCategory === sport.name
                    ? "bg-brand-accent/15 text-white border-l-4 border-brand-lime"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }
              `}
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                <div 
                  className="absolute inset-0 rounded-lg opacity-20"
                  style={{ backgroundColor: sport.color }}
                />
                <span className="text-lg relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-md">
                  {sport.icon}
                </span>
              </div>
              <span className={`truncate tracking-wide ${activeCategory === sport.name ? 'font-bold' : ''}`}>{sport.name}</span>
            </button>
          ))}
        </div>

        {/* Other Menu */}
        <div className="border-t border-brand-border py-2">
          <p className="px-4 py-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            Other Menu
          </p>
          {otherMenu.map((item) => (
            <a
              key={item.name}
              href="#"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent hover:text-white transition-all duration-300 group border-l-4 border-transparent"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                <div 
                  className="absolute inset-0 rounded-lg opacity-20"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-lg relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-md">
                  {item.icon}
                </span>
              </div>
              <span className="truncate tracking-wide">{item.name}</span>
              {item.name === "Language : EN" && (
                <svg className="ml-auto w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </a>
          ))}
        </div>

        {/* Security & Logout */}
        <div className="border-t border-brand-border py-2">
          <p className="px-4 py-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            Security & Logout
          </p>
          {securityMenu.map((item) => (
            <a
              key={item.name}
              href="#"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent hover:text-white transition-all duration-300 group border-l-4 border-transparent"
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                <div 
                  className="absolute inset-0 rounded-lg opacity-20"
                  style={{ backgroundColor: item.color }}
                />
                 <span className="text-lg relative z-10 transition-transform duration-300 group-hover:scale-110 drop-shadow-md">
                  {item.icon}
                </span>
              </div>
              <span className="truncate tracking-wide">{item.name}</span>
            </a>
          ))}
        </div>

        {/* WhatsApp Button */}
        <div className="p-3 border-t border-brand-border">
          <a
            href="#"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-all duration-200 uppercase tracking-wider"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Follow on WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}
