import { useState } from "react";
import { storage } from "@/lib/v3/storage";
import { C, mono, sans, downloadJSON } from "@/lib/v3/ui";
import { Card, SectionLabel, Btn, Select } from "./primitives";

interface Settings {
  theme: "dark" | "darker";
  defaultModel: string;
  notifications: { email: boolean; browser: boolean; slack: boolean };
  retentionDays: number;
}

const DEFAULT: Settings = { theme: "dark", defaultModel: "gpt-4o", notifications: { email: true, browser: false, slack: false }, retentionDays: 30 };

export default function Settings() {
  const [s, setS] = useState<Settings>(() => storage.get<Settings>("nx_settings", DEFAULT));
  const [confirming, setConfirming] = useState(false);

  const save = (next: Settings) => { setS(next); storage.set("nx_settings", next); };
  const exportAll = () => downloadJSON("neurix-export-" + new Date().toISOString().split("T")[0] + ".json", storage.exportAll());
  const clearAll = () => { storage.clearAll(); window.location.reload(); };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <SectionLabel>Appearance</SectionLabel>
        <Label>Theme</Label>
        <Select value={s.theme} onChange={v => save({ ...s, theme: v as any })} options={["dark", "darker"]} />
        <div style={{ marginTop: 14 }}>
          <Label>Default Scan Model</Label>
          <Select value={s.defaultModel} onChange={v => save({ ...s, defaultModel: v })} options={["gpt-4o", "claude-3.5-sonnet", "gemini-1.5-pro"]} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Label>Data Retention (days)</Label>
          <Select value={String(s.retentionDays)} onChange={v => save({ ...s, retentionDays: parseInt(v) })} options={["7", "30", "90", "180", "365"]} />
        </div>
      </Card>

      <Card>
        <SectionLabel>Notifications</SectionLabel>
        {(["email", "browser", "slack"] as const).map(k => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", ...mono, fontSize: 12, color: C.text, textTransform: "capitalize" }}>
            <input type="checkbox" checked={s.notifications[k]} onChange={e => save({ ...s, notifications: { ...s.notifications, [k]: e.target.checked } })} style={{ accentColor: C.accent }} />
            {k}
          </label>
        ))}
      </Card>

      <Card style={{ gridColumn: "1 / -1" }}>
        <SectionLabel>Data Management</SectionLabel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="ghost" onClick={exportAll}>Export All Data</Btn>
          {!confirming ? (
            <Btn variant="ghost" onClick={() => setConfirming(true)}>Clear All Data</Btn>
          ) : (
            <>
              <span style={{ ...mono, fontSize: 11, color: C.danger, alignSelf: "center" }}>Are you sure? This cannot be undone.</span>
              <Btn variant="danger" onClick={clearAll}>Yes, Delete Everything</Btn>
              <Btn variant="ghost" onClick={() => setConfirming(false)}>Cancel</Btn>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

const Label = ({ children }: any) => <div style={{ ...mono, fontSize: 9, color: C.muted, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 4 }}>{children}</div>;
