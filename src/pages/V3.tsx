import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Shield, Activity, Wrench, AlertTriangle, Crosshair, History as HistIcon, KeyRound, Settings as SettIcon, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { C, mono, sans } from "@/lib/v3/ui";
import { seedIfEmpty } from "@/lib/v3/storage";
import Dashboard from "@/components/v3/Dashboard";
import Firewall from "@/components/v3/Firewall";
import Regression from "@/components/v3/Regression";
import Repair from "@/components/v3/Repair";
import Observability from "@/components/v3/Observability";
import RedTeam from "@/components/v3/RedTeam";
import History from "@/components/v3/History";
import Keys from "@/components/v3/Keys";
import Settings from "@/components/v3/Settings";

type Sec = "dashboard" | "firewall" | "regression" | "repair" | "observability" | "redteam" | "history" | "keys" | "settings";

const NAV: { id: Sec; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "firewall", label: "AI Firewall", icon: Shield },
  { id: "regression", label: "Prompt Regression", icon: Activity },
  { id: "repair", label: "Self-Healing", icon: Wrench },
  { id: "observability", label: "Observability", icon: AlertTriangle },
  { id: "redteam", label: "Red Team", icon: Crosshair },
  { id: "history", label: "Scan History", icon: HistIcon },
  { id: "keys", label: "API Keys", icon: KeyRound },
  { id: "settings", label: "Settings", icon: SettIcon },
];

export default function V3() {
  const [section, setSection] = useState<Sec>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { seedIfEmpty(); }, []);

  const active = NAV.find(n => n.id === section)!;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", ...sans }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        @keyframes nxShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes nxSpin { to{transform:rotate(360deg)} }
        .nx-spin { animation: nxSpin 0.8s linear infinite; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.muted}; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: collapsed ? 64 : 240, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "width 0.2s", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: collapsed ? 16 : 20, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {!collapsed && (
            <div>
              <div style={{ ...mono, fontSize: 16, letterSpacing: 3, color: C.text, fontWeight: 600 }}>NEURIX</div>
              <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.4, marginTop: 2 }}>V3 · RUNTIME</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav style={{ flex: 1, padding: 8, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {NAV.map(n => {
            const isActive = n.id === section;
            return (
              <button key={n.id} onClick={() => setSection(n.id)}
                title={collapsed ? n.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px 12px" : "9px 12px",
                  background: isActive ? C.accent + "12" : "transparent",
                  border: "none", borderLeft: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
                  color: isActive ? C.accent : C.textDim, cursor: "pointer", borderRadius: 4, textAlign: "left",
                  ...mono, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: isActive ? 600 : 400,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = C.surface2)}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}
              >
                <n.icon size={14} />
                {!collapsed && <span>{n.label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: C.muted, cursor: "pointer", ...mono, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            <ArrowLeft size={12} /> {!collapsed && "Exit V3"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ padding: "16px 28px", borderBottom: `1px solid ${C.border}`, background: C.surface + "cc", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.6, textTransform: "uppercase" }}>V3 · Production Runtime</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: "2px 0 0", color: C.text }}>{active.label}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, ...mono, fontSize: 10, color: C.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.success, animation: "nxShimmer 1.5s infinite" }} />
            SYSTEM ONLINE
          </div>
        </header>

        <div style={{ padding: 24, flex: 1 }}>
          {section === "dashboard" && <Dashboard onNav={setSection} />}
          {section === "firewall" && <Firewall />}
          {section === "regression" && <Regression />}
          {section === "repair" && <Repair />}
          {section === "observability" && <Observability />}
          {section === "redteam" && <RedTeam />}
          {section === "history" && <History />}
          {section === "keys" && <Keys />}
          {section === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}
