import type { Failure } from "@/components/FailureList";
import type { Alert } from "@/components/AlertFeed";

export interface StressTestResult {
  score: number;
  failures: Failure[];
  moneySaved: number;
  alerts: Alert[];
}

// Simulated stress test engine — generates realistic results
export function runStressTest(fileName: string): StressTestResult {
  const score = Math.floor(Math.random() * 40) + 35; // 35-75 range
  const failureTypes: Array<{ type: Failure["type"]; title: string; desc: string; impact: string; fix: string }> = [
    { type: "critical", title: "NULL HANDLING FAILURE", desc: "Model crashes on null/empty inputs in 23% of edge cases", impact: "$12,400/mo", fix: "Add null-safe preprocessing layer" },
    { type: "critical", title: "ADVERSARIAL INPUT VULNERABILITY", desc: "Crafted inputs cause 89% accuracy drop", impact: "$45,000/incident", fix: "Implement input sanitization + adversarial training" },
    { type: "warning", title: "DISTRIBUTION DRIFT DETECTED", desc: "Production data drifted 34% from training distribution", impact: "$8,200/mo", fix: "Add drift monitoring + auto-retrain trigger" },
    { type: "warning", title: "LATENCY SPIKE UNDER LOAD", desc: "P99 latency increases 400% at >1000 RPS", impact: "$3,100/mo", fix: "Optimize batch inference pipeline" },
    { type: "critical", title: "OUTLIER SENSITIVITY", desc: "Model predictions flip with 2% noise injection", impact: "$22,000/mo", fix: "Add robust normalization + outlier detection" },
    { type: "info", title: "FEATURE IMPORTANCE IMBALANCE", desc: "Top 3 features account for 91% of decisions", impact: "$1,500/mo", fix: "Regularize + add feature diversity" },
    { type: "warning", title: "BIAS DETECTED IN SUBGROUP", desc: "15% accuracy gap across demographic segments", impact: "$50,000 legal risk", fix: "Apply fairness constraints + rebalance training data" },
    { type: "critical", title: "MEMORY LEAK IN INFERENCE", desc: "Memory usage grows unbounded after 10K predictions", impact: "$5,800/mo", fix: "Implement proper tensor cleanup + pooling" },
  ];

  const numFailures = Math.floor(Math.random() * 4) + 3;
  const shuffled = failureTypes.sort(() => Math.random() - 0.5);
  const failures: Failure[] = shuffled.slice(0, numFailures).map((f, i) => ({
    id: `f-${Date.now()}-${i}`,
    type: f.type,
    title: f.title,
    description: f.desc,
    impact: f.impact,
    fix: f.fix,
  }));

  const totalImpact = failures.length * 12000 + Math.floor(Math.random() * 30000);

  const alerts: Alert[] = [
    { id: `a-${Date.now()}-1`, type: "info", message: `Stress test initiated on ${fileName}`, timestamp: new Date() },
    { id: `a-${Date.now()}-2`, type: "warning", message: `${failures.length} vulnerabilities detected`, timestamp: new Date() },
    { id: `a-${Date.now()}-3`, type: "error", message: `Critical: ${failures.filter(f => f.type === "critical").length} critical failures found`, timestamp: new Date() },
    { id: `a-${Date.now()}-4`, type: "success", message: `Analysis complete. Reliability score: ${score}/100`, timestamp: new Date() },
  ];

  return { score, failures, moneySaved: totalImpact, alerts };
}

export function generateAdversarialResults() {
  return [
    { attack: "Prompt Injection", success: true, severity: "high" as const, description: "System prompt extraction via role-play attack" },
    { attack: "Data Poisoning", success: false, severity: "medium" as const, description: "Attempted training data corruption blocked" },
    { attack: "Model Inversion", success: true, severity: "high" as const, description: "Partial training data reconstructed from outputs" },
    { attack: "Evasion Attack", success: true, severity: "medium" as const, description: "Classification bypassed with imperceptible perturbations" },
    { attack: "Membership Inference", success: false, severity: "low" as const, description: "Could not determine training set membership" },
  ].sort(() => Math.random() - 0.5).slice(0, 4);
}
