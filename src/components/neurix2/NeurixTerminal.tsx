import { useState, useEffect } from "react";
import { Shield, Activity, FlaskConical, Bot, ArrowLeft, Power } from "lucide-react";
import CommandCenter from "./CommandCenter";
import Sentinel from "./Sentinel";
import Lab from "./Lab";
import NexusAI from "./NexusAI";
import { newSession, BUDGET_CAP, type SentinelState } from "@/lib/neurix-sentinel";

interface Props { onBack: () => void; }
type Section = "command" | "sentinel" | "lab" | "nexus";

const nav: { id: Section; label: string; icon: typeof Shield; sub: string }[] = [
  { id: "command", label: "Command Center", icon: Activity, sub: "Overview" },
  { id: "sentinel", label: "The Sentinel", icon: Shield, sub: "Firewall + Compliance" },
  { id: "lab", label: "The Lab", icon: FlaskConical, sub: "Shadow Engine" },
  { id: "nexus", label: "Nexus AI", icon: Bot, sub: "Multi-LLM Sandbox" },
];

export default function NeurixTerminal({ onBack }: Props) {
  const [section, setSection] = useState<Section>("command");
  const [state, setState] = useState<SentinelState>(() => newSession());

  // Live token-burn pulse (visual heartbeat)
  const [pulse, setPulse] = useState(0);
  useEffect(() => { const i = setInterval(() => setPulse(p => p + 1), 2000); return () => clearInterval(i); }, []);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0A0A0A] flex flex-col">
        <div className="p-4 border-b border-white/5">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-mono text-[#A0A0A0] hover:text-[#00FFFF] mb-3">
            <ArrowLeft className="w-3 h-3" /> EXIT TERMINAL
          </button>
          <div className="font-mono text-lg tracking-widest text-white">NEURIX</div>
          <div className="text-[10px] font-mono text-[#A0A0A0] uppercase tracking-wider">Security Terminal v2.0</div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(n => {
            const active = section === n.id;
            return (
              <button key={n.id} onClick={() => setSection(n.id)} className={`w-full text-left px-3 py-2.5 rounded transition-colors ${active ? "bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30" : "text-[#A0A0A0] hover:bg-white/5 hover:text-white border border-transparent"}`}>
                <div className="flex items-center gap-2">
                  <n.icon className="w-4 h-4" />
                  <span className="font-mono text-xs uppercase tracking-wider">{n.label}</span>
                </div>
                <div className="text-[10px] font-body text-[#A0A0A0] ml-6 mt-0.5">{n.sub}</div>
              </button>
            );
          })}
        </nav>

        {/* Live token burn */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <div className="bg-black border border-white/10 rounded p-2">
            <div className="flex items-center justify-between text-[9px] font-mono text-[#A0A0A0] uppercase">
              <span>Token Burn</span><span className={`w-1.5 h-1.5 rounded-full ${pulse % 2 === 0 ? "bg-[#00FFFF]" : "bg-[#00FFFF]/30"}`} />
            </div>
            <div className="font-mono text-sm text-[#00FFFF] mt-1">{state.totalTokens.toLocaleString()} <span className="text-[#A0A0A0] text-[10px]">tokens</span></div>
            <div className="font-mono text-[10px] text-[#A0A0A0]">${state.sessionCost.toFixed(4)} / ${BUDGET_CAP.toFixed(2)}</div>
            <div className="h-1 bg-white/5 rounded mt-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00FFFF] to-[#FF00FF]" style={{ width: `${Math.min(100, (state.sessionCost / BUDGET_CAP) * 100)}%` }} />
            </div>
          </div>
          {state.terminated && (
            <div className="bg-[#FF00FF]/10 border border-[#FF00FF]/40 rounded p-2 flex items-center gap-2 text-[#FF00FF] font-mono text-[10px]">
              <Power className="w-3 h-3" /> BUDGET EXHAUSTED
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-white/5 px-6 py-3 flex items-center justify-between bg-[#0A0A0A]/50 backdrop-blur sticky top-0 z-10">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-[#A0A0A0]">{nav.find(n => n.id === section)?.sub}</div>
            <h1 className="font-display text-xl text-white">{nav.find(n => n.id === section)?.label}</h1>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#A0A0A0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] animate-pulse" /> LIVE · {state.sessionId.slice(0, 8)}
          </div>
        </header>
        <div className="p-6">
          {section === "command" && <CommandCenter state={state} />}
          {section === "sentinel" && <Sentinel state={state} />}
          {section === "lab" && <Lab />}
          {section === "nexus" && <NexusAI state={state} onState={setState} />}
        </div>
      </main>
    </div>
  );
}
