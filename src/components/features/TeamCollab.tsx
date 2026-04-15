import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { score: number; failures: number; testsRun: number; }

const TeamCollab = ({ score, failures, testsRun }: Props) => {
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareId = btoa(JSON.stringify({ s: score, f: failures, t: testsRun, d: Date.now() })).slice(0, 20);
  const link = `${window.location.origin}?shared=${shareId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono text-muted-foreground">Generate a private link to share test results with your team.</p>
      {!generated ? (
        <Button onClick={() => setGenerated(true)} className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 font-mono text-[10px]">
          <Link2 className="w-3 h-3 mr-1" /> Generate Share Link
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-muted/30 rounded p-2 border border-border/30">
            <span className="text-[9px] font-mono text-primary flex-1 truncate">{link}</span>
            <button onClick={copyLink} className="text-muted-foreground hover:text-foreground">
              {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-[9px] font-mono text-muted-foreground">Anyone with this link can view your test results.</p>
        </div>
      )}
    </div>
  );
};

export default TeamCollab;
