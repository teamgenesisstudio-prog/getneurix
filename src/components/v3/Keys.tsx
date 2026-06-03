import { useState } from "react";
import { storage } from "@/lib/v3/storage";
import { C, mono, sans, relTime } from "@/lib/v3/ui";
import { Card, SectionLabel, Btn, Badge, Input } from "./primitives";
import { Plus, Trash2, Copy, Key } from "lucide-react";

interface ApiKey { id: string; label: string; key: string; createdAt: string; uses: number }

export default function Keys() {
  const [keys, setKeys] = useState<ApiKey[]>(() => storage.get("nx_api_keys", []));
  const [label, setLabel] = useState("");
  const [val, setVal] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);

  const persist = (next: ApiKey[]) => { setKeys(next); storage.set("nx_api_keys", next); };
  const add = () => {
    if (!label.trim() || !val.trim()) return;
    persist([{ id: crypto.randomUUID(), label, key: val, createdAt: new Date().toISOString(), uses: 0 }, ...keys]);
    setLabel(""); setVal("");
  };
  const remove = (id: string) => persist(keys.filter(k => k.id !== id));
  const copy = (id: string, k: string) => { navigator.clipboard.writeText(k); setRevealed(id); setTimeout(() => setRevealed(null), 1500); };
  const mask = (k: string) => "•".repeat(Math.max(0, k.length - 4)) + k.slice(-4);

  return (
    <Card>
      <SectionLabel>API Keys</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 120px", gap: 8, marginBottom: 18 }}>
        <Input placeholder="Label (e.g. Production)" value={label} onChange={e => setLabel(e.target.value)} />
        <Input placeholder="API key value" value={val} onChange={e => setVal(e.target.value)} type="password" />
        <Btn onClick={add}><Plus size={11} style={{ marginRight: 4 }} />Add Key</Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {keys.length === 0 && <div style={{ ...mono, fontSize: 11, color: C.muted, padding: 30, textAlign: "center" }}>No keys configured</div>}
        {keys.map(k => (
          <div key={k.id} style={{ display: "grid", gridTemplateColumns: "30px 200px 1fr 100px 100px 30px", gap: 12, padding: "10px 12px", background: C.surface2, borderRadius: 6, ...mono, fontSize: 11, alignItems: "center" }}>
            <Key size={14} color={C.accent} />
            <span style={{ color: C.text, fontWeight: 600 }}>{k.label}</span>
            <span style={{ color: C.textDim, fontFamily: "JetBrains Mono", letterSpacing: 0.5 }}>{revealed === k.id ? k.key : mask(k.key)}</span>
            <span style={{ color: C.muted }}>{k.uses.toLocaleString()} uses</span>
            <span style={{ color: C.muted }}>{relTime(k.createdAt)}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => copy(k.id, k.key)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }} title="Copy"><Copy size={12} /></button>
              <button onClick={() => remove(k.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }} title="Remove"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, padding: 12, background: C.warn + "0c", border: `1px solid ${C.warn}33`, borderRadius: 6, ...mono, fontSize: 10, color: C.warn }}>
        ⚠ Keys are stored locally in your browser. For production, route via the Neurix gateway with server-side secret storage.
      </div>
    </Card>
  );
}
