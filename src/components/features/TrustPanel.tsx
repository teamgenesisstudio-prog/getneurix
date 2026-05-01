import { useEffect, useMemo, useState, useCallback } from "react";
import { Shield, Key, Activity, Download, Trash2, RefreshCw, Copy, Check, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AuditLog, ActionType, getAllLogs, deleteAllLogs, exportLogsAsJSON,
  getApiKey, generateApiKey, revokeApiKey, simulateApiCall,
  getRateLimitState, getUserId, RATE_LIMIT_PER_HOUR, ApiKeyRecord,
} from "@/lib/trust-store";

const ACTION_TYPES: ActionType[] = [
  "upload_model", "test_model", "fix_model", "delete_data",
  "export_report", "api_call", "generate_key", "revoke_key",
];

const TrustPanel = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState<ActionType | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [apiKey, setApiKey] = useState<ApiKeyRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [endpoint, setEndpoint] = useState<"/api/neurix/test" | "/api/neurix/status">("/api/neurix/test");
  const [testKey, setTestKey] = useState("");
  const [testInput, setTestInput] = useState("sample-model-data-for-testing");
  const [testResult, setTestResult] = useState<{ status: number; body: unknown } | null>(null);
  const [rateState, setRateState] = useState(() => ({ remaining: RATE_LIMIT_PER_HOUR, next_reset: "" }));
  const PAGE_SIZE = 25;

  const refresh = useCallback(async () => {
    const all = await getAllLogs();
    setLogs(all);
    const k = getApiKey();
    setApiKey(k);
    if (k && !k.revoked) {
      const rl = getRateLimitState(k.key);
      setRateState({ remaining: rl.remaining, next_reset: rl.next_reset });
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (filter !== "all" && l.action_type !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!l.action_type.includes(s) &&
            !l.user_id.toLowerCase().includes(s) &&
            !JSON.stringify(l.details).toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [logs, filter, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleGenerate = async () => {
    const rec = await generateApiKey();
    setApiKey(rec);
    setTestKey(rec.key);
    toast({ title: "API key generated", description: "Stored locally. Never sent to any server." });
    void refresh();
  };

  const handleRevoke = async () => {
    await revokeApiKey();
    toast({ title: "API key revoked", description: "All future requests with this key return 401." });
    void refresh();
  };

  const handleCopy = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTestRequest = async () => {
    if (!testKey) {
      toast({ title: "Enter an API key", variant: "destructive" });
      return;
    }
    const payload = endpoint === "/api/neurix/test" ? { model: testInput } : {};
    const res = await simulateApiCall(testKey, endpoint, payload);
    setTestResult({ status: res.status, body: res.body });
    void refresh();
  };

  const handleExport = async () => {
    const json = await exportLogsAsJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurix-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${logs.length} log entries downloaded.` });
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete all ${logs.length} audit logs? This cannot be undone.`)) return;
    await deleteAllLogs();
    toast({ title: "Audit logs cleared", description: "All local audit data has been deleted." });
    void refresh();
  };

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of logs) m[l.action_type] = (m[l.action_type] || 0) + 1;
    return m;
  }, [logs]);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-widest"><Activity className="w-3 h-3" />TOTAL LOGS</div>
          <div className="font-display text-2xl font-bold text-primary mt-1">{logs.length}</div>
        </div>
        <div className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-widest"><Shield className="w-3 h-3" />USER ID</div>
          <div className="font-mono text-[10px] text-foreground mt-1 truncate">{getUserId()}</div>
        </div>
        <div className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-widest"><Key className="w-3 h-3" />API KEY</div>
          <div className="font-display text-sm font-bold mt-1">
            {!apiKey ? <span className="text-muted-foreground">NONE</span> :
              apiKey.revoked ? <span className="text-destructive">REVOKED</span> :
                <span className="text-success">ACTIVE</span>}
          </div>
        </div>
        <div className="glass-panel rounded-lg p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tracking-widest">RATE LIMIT</div>
          <div className="font-display text-2xl font-bold text-warning mt-1">{rateState.remaining}<span className="text-xs text-muted-foreground">/{RATE_LIMIT_PER_HOUR}</span></div>
        </div>
      </div>

      {/* API KEY MANAGER */}
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-bold tracking-wider">API KEY MANAGER</h3>
        </div>

        {!apiKey || apiKey.revoked ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">No active API key. Generate one to integrate NEURIX into your pipeline. Keys are stored only on this device.</p>
            <Button onClick={handleGenerate} className="bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-xs">
              <Key className="w-3 h-3 mr-1" /> GENERATE API KEY
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted/50 px-3 py-2 rounded font-mono text-[11px] break-all">{apiKey.key}</code>
              <Button variant="outline" size="sm" onClick={handleCopy} className="font-mono text-xs">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap text-[10px] font-mono text-muted-foreground">
              <span>Created: {new Date(apiKey.created_at).toLocaleString()}</span>
              <span>•</span>
              <span>Resets: {rateState.next_reset ? new Date(rateState.next_reset).toLocaleTimeString() : "—"}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} variant="outline" size="sm" className="font-mono text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> REGENERATE
              </Button>
              <Button onClick={handleRevoke} variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10 font-mono text-xs">
                REVOKE
              </Button>
            </div>
          </div>
        )}

        {/* TESTER */}
        <div className="mt-5 pt-5 border-t border-border/30">
          <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">REQUEST TESTER</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <select
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value as typeof endpoint)}
              className="bg-muted/50 border border-border rounded px-2 py-2 text-xs font-mono"
            >
              <option value="/api/neurix/test">POST /api/neurix/test</option>
              <option value="/api/neurix/status">GET /api/neurix/status</option>
            </select>
            <Input
              placeholder="API key"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              className="font-mono text-xs"
            />
            <Button onClick={handleTestRequest} className="bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-xs">
              <Send className="w-3 h-3 mr-1" /> SEND
            </Button>
          </div>
          {endpoint === "/api/neurix/test" && (
            <Input
              placeholder="model data (string)"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="font-mono text-xs mb-2"
            />
          )}
          {testResult && (
            <div className="bg-background/60 border border-border/40 rounded p-3 font-mono text-[11px]">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  testResult.status === 200 ? "bg-success/20 text-success" :
                  testResult.status === 429 ? "bg-warning/20 text-warning" :
                  "bg-destructive/20 text-destructive"
                }`}>HTTP {testResult.status}</span>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(testResult.body, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* AUDIT LOGS */}
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="font-display text-sm font-bold tracking-wider">AUDIT LOGS</h3>
            <span className="text-[10px] font-mono text-muted-foreground">({filtered.length} of {logs.length})</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm" className="font-mono text-xs" disabled={logs.length === 0}>
              <Download className="w-3 h-3 mr-1" /> EXPORT JSON
            </Button>
            <Button onClick={handleDeleteAll} variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10 font-mono text-xs" disabled={logs.length === 0}>
              <Trash2 className="w-3 h-3 mr-1" /> DELETE ALL
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="font-mono text-xs pl-7 h-8"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as ActionType | "all"); setPage(0); }}
            className="bg-muted/50 border border-border rounded px-2 text-xs font-mono h-8"
          >
            <option value="all">All actions ({logs.length})</option>
            {ACTION_TYPES.map(t => (
              <option key={t} value={t}>{t} ({counts[t] || 0})</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-muted-foreground">
            No logs yet. Every action you take in NEURIX is recorded here.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-border/30 text-muted-foreground tracking-wider">
                    <th className="text-left py-2 pr-3">TIME</th>
                    <th className="text-left py-2 pr-3">ACTION</th>
                    <th className="text-left py-2 pr-3">STATUS</th>
                    <th className="text-right py-2 pr-3">DURATION</th>
                    <th className="text-left py-2">DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((l, i) => (
                    <tr key={l.id ?? i} className="border-b border-border/10 hover:bg-muted/20">
                      <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-primary">{l.action_type}</td>
                      <td className="py-2 pr-3">
                        <span className={l.action_status === "success" ? "text-success" : "text-destructive"}>
                          {l.action_status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right">{l.duration_ms}ms</td>
                      <td className="py-2 truncate max-w-[280px] text-muted-foreground">{JSON.stringify(l.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-muted-foreground">
              <span>Page {page + 1} of {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">PREV</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">NEXT</Button>
              </div>
            </div>
          </>
        )}

        <p className="text-[9px] font-mono text-muted-foreground mt-4 pt-3 border-t border-border/20">
          🔒 100% local. Logs stored in IndexedDB on this device. Never transmitted to any server.
        </p>
      </div>
    </div>
  );
};

export default TrustPanel;
