import { useState } from "react";
import { Link } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import NeurixTerminal from "@/components/neurix2/NeurixTerminal";

type View = "landing" | "v1" | "v2";

const Index = () => {
  const [view, setView] = useState<View>("landing");

  if (view === "v1") return <Dashboard onBack={() => setView("landing")} />;
  if (view === "v2") return <NeurixTerminal onBack={() => setView("landing")} />;

  return (
    <div>
      <LandingPage onEnter={() => setView("v2")} />
      {/* Floating switcher */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 bg-black/80 backdrop-blur border border-white/10 rounded-lg p-2">
        <button onClick={() => setView("v2")} className="px-3 py-1.5 rounded bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/30 font-mono text-[10px] uppercase tracking-wider">Enter Terminal v2</button>
        <button onClick={() => setView("v1")} className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-mono text-[10px] uppercase tracking-wider">Open v1 Dashboard</button>
        <Link to="/how-it-works" className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-mono text-[10px] uppercase tracking-wider text-center">How it Works</Link>
      </div>
    </div>
  );
};

export default Index;
