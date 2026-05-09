import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, Plus, Trash2, RefreshCw, ArrowRight, LogOut, Database, Cpu, Route, BookOpen, ChevronDown, ChevronRight } from "lucide-react";

type Dataset = {
  id: string; name: string; description: string | null;
  source_model: string; target_model: string | null; status: string;
  pair_count: number; auto_capture: boolean; created_at: string;
};
type Pair = {
  id: string; prompt: string; response: string; system_prompt: string | null;
  category: string | null; token_count_input: number | null;
  token_count_output: number | null; quality_score: number | null;
};
type Job = {
  id: string; dataset_id: string; provider: string; base_model: string;
  status: string; fine_tuned_model_id: string | null; training_cost_usd: number | null;
  started_at: string | null; completed_at: string | null; error_message: string | null;
  provider_job_id: string | null;
  distillation_datasets?: { name: string };
};
type RouteRow = {
  id: string; source_model: string; distilled_model: string; provider: string;
  active: boolean; confidence_threshold: number; requests_routed: number;
  requests_escalated: number; cost_saved_usd: number;
};

const SOURCE_MODELS = ["gpt-4o", "gpt-4o-mini", "claude-3.5-sonnet", "gemini-pro"];
const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
const TOGETHER_MODELS = [
  "meta-llama/Llama-3.1-8B-Instruct",
  "meta-llama/Llama-3.1-70B-Instruct",
  "mistralai/Mixtral-8x7B-Instruct-v0.1",
];

function statusBadge(s: string) {
  const map: Record<string, string> = {
    collecting: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    ready: "bg-green-500/20 text-green-300 border-green-500/40",
    fine_tuning: "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse",
    training: "bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse",
    pending: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
    queued: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    failed: "bg-red-500/20 text-red-300 border-red-500/40",
  };
  return <Badge variant="outline" className={`font-mono text-xs ${map[s] ?? ""}`}>● {s}</Badge>;
}

async function call(action: string, payload: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("distillation", {
    body: { action, ...payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function DistillationPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-100 grid place-items-center font-mono">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl tracking-tight">NEURIX // KNOWLEDGE DISTILLATION</h1>
          <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Sign out
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="capture">
          <TabsList className="bg-zinc-900 border border-zinc-800 overflow-x-auto">
            <TabsTrigger value="capture"><Database className="w-4 h-4 mr-1" />Capture</TabsTrigger>
            <TabsTrigger value="finetune"><Cpu className="w-4 h-4 mr-1" />Fine-Tune</TabsTrigger>
            <TabsTrigger value="routes"><Route className="w-4 h-4 mr-1" />Routes</TabsTrigger>
            <TabsTrigger value="how"><BookOpen className="w-4 h-4 mr-1" />How It Works</TabsTrigger>
          </TabsList>
          <TabsContent value="capture" className="mt-4"><CaptureTab /></TabsContent>
          <TabsContent value="finetune" className="mt-4"><FineTuneTab /></TabsContent>
          <TabsContent value="routes" className="mt-4"><RoutesTab /></TabsContent>
          <TabsContent value="how" className="mt-4"><HowItWorksTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ====================================================================
// Tab 1: Capture
// ====================================================================
function CaptureTab() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", source_model: "gpt-4o" });

  const refresh = async () => {
    try { const { datasets } = await call("list_datasets"); setDatasets(datasets); }
    catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    if (!form.name) return toast.error("Name required");
    try {
      await call("create_dataset", form);
      toast.success("Dataset created");
      setNewOpen(false);
      setForm({ name: "", description: "", source_model: "gpt-4o" });
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-mono text-lg">Datasets</h2>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />New Dataset</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Dataset</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Source Model</Label>
                <Select value={form.source_model} onValueChange={(v) => setForm({ ...form, source_model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCE_MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {datasets.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-400">
            <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No datasets yet. Create your first dataset to start capturing prompt/response pairs.</p>
            <Button className="mt-4" onClick={() => setNewOpen(true)}><Plus className="w-4 h-4 mr-1" />New Dataset</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {datasets.map((d) => (
          <DatasetCard key={d.id} dataset={d} expanded={openId === d.id}
            onToggle={() => setOpenId(openId === d.id ? null : d.id)} onChange={refresh} />
        ))}
      </div>
    </div>
  );
}

function DatasetCard({ dataset, expanded, onToggle, onChange }: {
  dataset: Dataset; expanded: boolean; onToggle: () => void; onChange: () => void;
}) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [pairOpen, setPairOpen] = useState(false);
  const [pf, setPf] = useState({ prompt: "", response: "", system_prompt: "", category: "", token_count_input: 0, token_count_output: 0 });
  const [minQ, setMinQ] = useState(0.5);

  const loadPairs = async () => {
    try { const { pairs } = await call("list_pairs", { dataset_id: dataset.id }); setPairs(pairs); }
    catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { if (expanded) loadPairs(); }, [expanded]);

  const addPair = async () => {
    if (!pf.prompt || !pf.response) return toast.error("Prompt and response required");
    try {
      await call("create_pair", { dataset_id: dataset.id, ...pf });
      toast.success("Pair added");
      setPairOpen(false);
      setPf({ prompt: "", response: "", system_prompt: "", category: "", token_count_input: 0, token_count_output: 0 });
      loadPairs(); onChange();
    } catch (e: any) { toast.error(e.message); }
  };

  const exportFmt = async (format: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("distillation", {
        body: { action: "export", dataset_id: dataset.id, format, min_quality_score: minQ },
      });
      if (error) throw error;
      const blob = new Blob([typeof data === "string" ? data : JSON.stringify(data)], { type: "application/x-ndjson" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "alpaca" || format === "sharegpt" ? "json" : "jsonl";
      a.download = `${dataset.name}-${format}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${format}`);
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleAuto = async (v: boolean) => {
    try { await call("toggle_auto_capture", { id: dataset.id, auto_capture: v }); onChange(); }
    catch (e: any) { toast.error(e.message); }
  };

  const del = async () => {
    try { await call("delete_dataset", { id: dataset.id }); toast.success("Deleted"); onChange(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <CardTitle className="text-base">{dataset.name}</CardTitle>
            <Badge variant="outline" className="font-mono text-xs">{dataset.source_model}</Badge>
            {statusBadge(dataset.status)}
          </div>
          <div className="text-xs font-mono text-zinc-400">
            {dataset.pair_count} pairs · {new Date(dataset.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-4 border-t border-zinc-800 pt-4">
          {dataset.description && <p className="text-sm text-zinc-400">{dataset.description}</p>}

          <div className="flex flex-wrap gap-3 items-center">
            <Dialog open={pairOpen} onOpenChange={setPairOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Pair</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Add Pair</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  <div><Label>System Prompt</Label><Textarea value={pf.system_prompt} onChange={(e) => setPf({ ...pf, system_prompt: e.target.value })} /></div>
                  <div><Label>Prompt *</Label><Textarea value={pf.prompt} onChange={(e) => setPf({ ...pf, prompt: e.target.value })} /></div>
                  <div><Label>Response *</Label><Textarea value={pf.response} onChange={(e) => setPf({ ...pf, response: e.target.value })} /></div>
                  <div><Label>Category</Label><Input value={pf.category} onChange={(e) => setPf({ ...pf, category: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Input tokens</Label><Input type="number" value={pf.token_count_input} onChange={(e) => setPf({ ...pf, token_count_input: +e.target.value })} /></div>
                    <div><Label>Output tokens</Label><Input type="number" value={pf.token_count_output} onChange={(e) => setPf({ ...pf, token_count_output: +e.target.value })} /></div>
                  </div>
                </div>
                <DialogFooter><Button onClick={addPair}>Add</Button></DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2">
              <Switch checked={dataset.auto_capture} onCheckedChange={toggleAuto} />
              <Label className="text-xs font-mono">Auto-Capture</Label>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" />Export</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportFmt("openai")}>OpenAI JSONL</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFmt("together")}>Together JSONL</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFmt("alpaca")}>Alpaca JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportFmt("sharegpt")}>ShareGPT JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 min-w-[200px]">
              <Label className="text-xs font-mono whitespace-nowrap">Quality ≥ {minQ.toFixed(2)}</Label>
              <Slider value={[minQ]} onValueChange={(v) => setMinQ(v[0])} min={0} max={1} step={0.05} />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete dataset?</AlertDialogTitle>
                  <AlertDialogDescription>All pairs will be deleted. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={del}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="border border-zinc-800 rounded">
            <table className="w-full text-xs font-mono">
              <thead className="bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="text-left p-2">Prompt</th>
                  <th className="text-left p-2">Response</th>
                  <th className="text-left p-2">Cat</th>
                  <th className="text-left p-2">Q</th>
                  <th className="text-left p-2">In/Out</th>
                </tr>
              </thead>
              <tbody>
                {pairs.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-zinc-500">No pairs yet</td></tr>}
                {pairs.map((p) => (
                  <tr key={p.id} className="border-t border-zinc-800">
                    <td className="p-2 max-w-[200px] truncate">{p.prompt.slice(0, 80)}</td>
                    <td className="p-2 max-w-[200px] truncate">{p.response.slice(0, 80)}</td>
                    <td className="p-2">{p.category ?? "—"}</td>
                    <td className="p-2">{p.quality_score?.toFixed(2) ?? "—"}</td>
                    <td className="p-2">{p.token_count_input ?? 0}/{p.token_count_output ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ====================================================================
// Tab 2: Fine-Tune
// ====================================================================
function FineTuneTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dataset_id: "", provider: "openai", base_model: "gpt-4o-mini",
    epochs: 3, learning_rate_multiplier: 1.0, custom_endpoint: "",
  });

  const refresh = async () => {
    try {
      const { jobs } = await call("list_jobs");
      setJobs(jobs);
      const { datasets } = await call("list_datasets");
      setDatasets(datasets);
    } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    if (!form.dataset_id) return toast.error("Pick a dataset");
    try {
      await call("create_job", form);
      toast.success("Job created");
      setOpen(false);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const check = async (id: string) => {
    try { await call("check_job_status", { job_id: id }); toast.success("Status updated"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };

  const eligible = datasets.filter((d) => d.status === "ready" || d.status === "collecting");
  const baseOptions = form.provider === "openai" ? OPENAI_MODELS : form.provider === "together" ? TOGETHER_MODELS : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-mono text-lg">Fine-Tuning Jobs</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />New Training Job</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Training Job</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Dataset</Label>
                <Select value={form.dataset_id} onValueChange={(v) => setForm({ ...form, dataset_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {eligible.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} ({d.pair_count} pairs)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v, base_model: v === "openai" ? "gpt-4o-mini" : v === "together" ? TOGETHER_MODELS[0] : "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="together">Together AI</SelectItem>
                    <SelectItem value="custom">Custom Endpoint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Base Model</Label>
                {baseOptions ? (
                  <Select value={form.base_model} onValueChange={(v) => setForm({ ...form, base_model: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{baseOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={form.base_model} onChange={(e) => setForm({ ...form, base_model: e.target.value })} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Epochs</Label><Input type="number" min={1} max={10} value={form.epochs} onChange={(e) => setForm({ ...form, epochs: +e.target.value })} /></div>
                <div><Label>LR Multiplier</Label><Input type="number" step="0.1" value={form.learning_rate_multiplier} onChange={(e) => setForm({ ...form, learning_rate_multiplier: +e.target.value })} /></div>
              </div>
              {form.provider === "custom" && (
                <div><Label>Endpoint URL</Label><Input value={form.custom_endpoint} onChange={(e) => setForm({ ...form, custom_endpoint: e.target.value })} /></div>
              )}
            </div>
            <DialogFooter><Button onClick={create}>Launch</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {jobs.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-400">
            <Cpu className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No training jobs yet. Launch your first job to distill a smaller model.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {jobs.map((j) => (
          <Card key={j.id} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm">{j.distillation_datasets?.name ?? "—"}</span>
                  <Badge variant="outline" className="font-mono text-xs">{j.provider}</Badge>
                  <span className="font-mono text-xs text-zinc-400">{j.base_model}</span>
                  {statusBadge(j.status)}
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  {j.training_cost_usd != null && <span className="text-emerald-400">${j.training_cost_usd.toFixed(2)}</span>}
                  <Button size="sm" variant="outline" onClick={() => check(j.id)}><RefreshCw className="w-3 h-3 mr-1" />Check Status</Button>
                </div>
              </div>
              {j.status === "training" && (
                <div className="h-1 bg-zinc-800 rounded overflow-hidden">
                  <div className="h-full w-1/3 bg-blue-500 animate-pulse" />
                </div>
              )}
              <div className="text-xs font-mono text-zinc-500 flex flex-wrap gap-4">
                {j.started_at && <span>started: {new Date(j.started_at).toLocaleString()}</span>}
                {j.completed_at && <span>completed: {new Date(j.completed_at).toLocaleString()}</span>}
                {j.fine_tuned_model_id && <span className="text-emerald-300">model: {j.fine_tuned_model_id}</span>}
                {j.error_message && <span className="text-red-400">{j.error_message}</span>}
              </div>
              {j.status === "completed" && j.fine_tuned_model_id && (
                <CreateRouteFromJob job={j} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateRouteFromJob({ job }: { job: Job }) {
  const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true);
    try {
      const { data: ds } = await supabase.from("distillation_datasets").select("source_model").eq("id", job.dataset_id).single();
      await call("create_route", {
        source_model: ds?.source_model ?? "gpt-4o",
        distilled_model: job.fine_tuned_model_id,
        provider: job.provider,
      });
      toast.success("Route created — switch to Routes tab");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  return <Button size="sm" disabled={busy} onClick={create}><ArrowRight className="w-3 h-3 mr-1" />Create Route</Button>;
}

// ====================================================================
// Tab 3: Routes
// ====================================================================
function RoutesTab() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    source_model: "gpt-4o", job_id: "", confidence_threshold: 0.85, active: true,
  });

  const refresh = async () => {
    try {
      const { routes } = await call("list_routes");
      setRoutes(routes);
      const { jobs } = await call("list_jobs");
      setJobs(jobs.filter((j: Job) => j.status === "completed" && j.fine_tuned_model_id));
    } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const create = async () => {
    const job = jobs.find((j) => j.id === form.job_id);
    if (!job) return toast.error("Pick a completed job");
    try {
      await call("create_route", {
        source_model: form.source_model,
        distilled_model: job.fine_tuned_model_id,
        provider: job.provider,
        confidence_threshold: form.confidence_threshold,
      });
      toast.success("Route created");
      setOpen(false);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const toggle = async (r: RouteRow, v: boolean) => {
    try { await call("update_route", { route_id: r.id, active: v }); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };

  const del = async (id: string) => {
    try { await call("delete_route", { id }); toast.success("Deleted"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-mono text-lg">Smart Routes</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />New Route</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Route</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Source Model</Label>
                <Select value={form.source_model} onValueChange={(v) => setForm({ ...form, source_model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCE_MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Distilled Model (completed job)</Label>
                <Select value={form.job_id} onValueChange={(v) => setForm({ ...form, job_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {jobs.length === 0 && <div className="p-2 text-xs text-zinc-500">No completed jobs</div>}
                    {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.fine_tuned_model_id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Confidence Threshold: {form.confidence_threshold.toFixed(2)}</Label>
                <Slider value={[form.confidence_threshold]} min={0.5} max={1} step={0.01}
                  onValueChange={(v) => setForm({ ...form, confidence_threshold: v[0] })} />
              </div>
            </div>
            <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {routes.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center text-zinc-400">
            <Route className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No routes yet. Create one to start saving on inference cost.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {routes.map((r) => {
          const total = r.requests_routed + r.requests_escalated;
          const ratio = total > 0 ? (r.requests_routed / total) * 100 : 0;
          return (
            <Card key={r.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-sm flex-wrap">
                    <span>{r.source_model}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                    <span className="text-emerald-300">{r.distilled_model}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{r.provider}</Badge>
                </div>
                <div className="text-3xl font-mono text-emerald-400">${r.cost_saved_usd.toFixed(2)}</div>
                <div className="text-xs text-zinc-500 font-mono">total saved</div>
                <div>
                  <div className="text-xs font-mono text-zinc-400 mb-1">Routed {r.requests_routed} · Escalated {r.requests_escalated}</div>
                  <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={r.active} onCheckedChange={(v) => toggle(r, v)} />
                    <Label className="text-xs font-mono">{r.active ? "Active" : "Inactive"}</Label>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">τ ≥ {r.confidence_threshold.toFixed(2)}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete route?</AlertDialogTitle>
                        <AlertDialogDescription>Future requests will go straight to {r.source_model}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del(r.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ====================================================================
// Tab 4: How It Works
// ====================================================================
function HowItWorksTab() {
  const steps = [
    { n: 1, t: "Capture", d: "Neurix logs every GPT-4 prompt and response pair automatically. No manual work needed.", icon: Database },
    { n: 2, t: "Export", d: "Download your dataset in OpenAI, Together, or Alpaca format. One click.", icon: Download },
    { n: 3, t: "Fine-Tune", d: "Launch a fine-tuning job on OpenAI or Together AI. Neurix tracks the job status and cost. A small model learns to mimic GPT-4 on your specific task.", icon: Cpu },
    { n: 4, t: "Route & Save", d: "Neurix routes future requests to your distilled model. Only escalates back to GPT-4 when confidence is low. Cut your bill by up to 90%.", icon: Route },
  ];
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.n} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-300 grid place-items-center font-mono">{s.n}</div>
                  <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="font-mono text-lg">{s.t}</div>
                <p className="text-sm text-zinc-400">{s.d}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="font-mono">FAQ</CardTitle></CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="gpu">
              <AccordionTrigger>Do I need my own GPU?</AccordionTrigger>
              <AccordionContent>No. Fine-tuning runs on OpenAI or Together AI infrastructure. You just click and wait.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="cost">
              <AccordionTrigger>How much does fine-tuning cost?</AccordionTrigger>
              <AccordionContent>OpenAI fine-tuning gpt-4o-mini starts at ~$0.30 per 1M tokens. A typical 500-pair dataset costs under $2 to fine-tune.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="quality">
              <AccordionTrigger>What if the distilled model gives bad answers?</AccordionTrigger>
              <AccordionContent>Neurix's Compute Guard monitors confidence. If the distilled model scores below your threshold, the request is automatically escalated back to the original GPT-4 model. You never lose quality.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
