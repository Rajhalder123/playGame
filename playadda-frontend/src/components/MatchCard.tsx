interface OddsButton {
  value: string;
  subtext?: string;
}

interface MatchCardProps {
  sport: string;
  sportIcon: string;
  tournament: string;
  teamA: string;
  teamB: string;
  dateTime: string;
  isLive: boolean;
  odds: OddsButton[];
}

export default function MatchCard({
  sport,
  sportIcon,
  tournament,
  teamA,
  teamB,
  dateTime,
  isLive,
  odds,
}: MatchCardProps) {
  return (
    <div className="min-w-[300px] md:min-w-[320px] bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-accent/40 transition-all duration-300 group flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-surface/50 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">{sportIcon}</span>
          <span className="text-xs font-bold text-brand-lime uppercase tracking-wider">
            {sport}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2.5 py-1 text-[10px] font-bold bg-brand-accent/20 text-brand-lime rounded-md hover:bg-brand-accent/30 transition-colors">
            MO
          </button>
          <button className="px-2.5 py-1 text-[10px] font-bold bg-white/5 text-gray-400 rounded-md hover:bg-white/10 transition-colors">
            BM
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-brand-accent font-semibold">{tournament}</p>
          <p className="text-sm font-bold text-white mt-1">
            {teamA} V {teamB}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-brand-muted">{dateTime}</span>
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* Odds Grid */}
        <div className="grid grid-cols-6 gap-1.5">
          {odds.map((odd, index) => (
            <button
              key={index}
              className={`
                py-2 px-1 rounded-lg text-center transition-all duration-200
                ${
                  odd.value
                    ? index % 2 === 0
                      ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/20"
                      : "bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/20"
                    : "bg-white/5 text-gray-500"
                }
              `}
            >
              <span className="text-xs font-bold block">{odd.value || "-"}</span>
              {odd.subtext && (
                <span className="text-[9px] text-gray-500 block">{odd.subtext}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
