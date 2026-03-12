import MatchCard from "./MatchCard";

const matchesData = [
  {
    sport: "TENNIS",
    sportIcon: "🎾",
    tournament: "ATP Indian Wells 2026",
    teamA: "Ri Hijikata",
    teamB: "Norrie",
    dateTime: "11 Mar 11:30PM",
    isLive: true,
    odds: [
      { value: "", subtext: "" },
      { value: "", subtext: "" },
      { value: "", subtext: "" },
      { value: "", subtext: "" },
      { value: "1.04", subtext: "BACK" },
      { value: "1.05", subtext: "LAY" },
    ],
  },
  {
    sport: "TENNIS",
    sportIcon: "🎾",
    tournament: "WTA Indian Wells 2026",
    teamA: "Muchova",
    teamB: "Iga Swiatek",
    dateTime: "11 Mar 11:40PM",
    isLive: true,
    odds: [
      { value: "1.40", subtext: "13K" },
      { value: "4.90", subtext: "32K" },
      { value: "", subtext: "" },
      { value: "", subtext: "" },
      { value: "1.01", subtext: "BACK" },
      { value: "", subtext: "" },
    ],
  },
  {
    sport: "FOOTBALL",
    sportIcon: "⚽",
    tournament: "UEFA Champions League",
    teamA: "Leverkusen",
    teamB: "Arsenal",
    dateTime: "11 Mar 12:15 PM",
    isLive: true,
    odds: [
      { value: "1.45", subtext: "24K" },
      { value: "1.46", subtext: "80K" },
      { value: "3.95", subtext: "12K" },
      { value: "4", subtext: "22K" },
      { value: "16.50", subtext: "20K" },
      { value: "17", subtext: "14K" },
    ],
  },
  {
    sport: "FOOTBALL",
    sportIcon: "⚽",
    tournament: "English Sky Bet Championship",
    teamA: "Oxford Utd",
    teamB: "Blackburn",
    dateTime: "Today 01:15 AM",
    isLive: false,
    odds: [
      { value: "2.82", subtext: "5K" },
      { value: "2.90", subtext: "8K" },
      { value: "3.20", subtext: "6K" },
      { value: "3.30", subtext: "10K" },
      { value: "2.94", subtext: "4K" },
      { value: "3.05", subtext: "7K" },
    ],
  },
  {
    sport: "CRICKET",
    sportIcon: "🏏",
    tournament: "IPL 2026",
    teamA: "Mumbai Indians",
    teamB: "CSK",
    dateTime: "12 Mar 7:30PM",
    isLive: false,
    odds: [
      { value: "1.85", subtext: "50K" },
      { value: "1.90", subtext: "45K" },
      { value: "", subtext: "" },
      { value: "", subtext: "" },
      { value: "2.00", subtext: "30K" },
      { value: "2.10", subtext: "25K" },
    ],
  },
];

export default function TopMatches() {
  return (
    <section className="pt-2 pb-6">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-8 bg-brand-lime rounded-full" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
          Top Matches
        </h2>
      </div>

      {/* Scrollable Cards */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
        {matchesData.map((match, index) => (
          <MatchCard key={index} {...match} />
        ))}
      </div>
      </div>
    </section>
  );
}
