import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import HeroBanners from "@/components/HeroBanners";
import TopMatches from "@/components/TopMatches";
import CricketBattle from "@/components/CricketBattle";
import NewLaunch from "@/components/NewLaunch";
import TradingGames from "@/components/TradingGames";
import RecommendedGames from "@/components/RecommendedGames";
import LiveCasinoGames from "@/components/LiveCasinoGames";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <HeroBanners />
          <TopMatches />
          <CricketBattle />
          <NewLaunch />
          <TradingGames />
          <RecommendedGames />
          <LiveCasinoGames />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
