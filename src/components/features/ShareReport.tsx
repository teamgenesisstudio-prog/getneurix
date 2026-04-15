import { Share2, Twitter, Linkedin, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props { score: number; failures: number; moneySaved: number; testsRun: number; model: string; }

const ShareReport = ({ score, failures, moneySaved, testsRun, model }: Props) => {
  const [copied, setCopied] = useState(false);
  const text = `🧠 NEURIX AI Stress Test Results:\n🛡️ Health Score: ${score}/100\n⚠️ Vulnerabilities Found: ${failures}\n💰 Estimated Savings: $${moneySaved.toLocaleString()}\n🔬 Tests Run: ${testsRun}\n🤖 Model: ${model}\n\nStress-test your AI → getneurix.lovable.app`;
  const encodedText = encodeURIComponent(text);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-lg p-4 border border-border/30 text-[10px] font-mono whitespace-pre-line">{text}</div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank")} variant="outline" className="text-[10px] font-mono border-border/30">
          <Twitter className="w-3 h-3 mr-1" /> Share on X
        </Button>
        <Button onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://getneurix.lovable.app")}`, "_blank")} variant="outline" className="text-[10px] font-mono border-border/30">
          <Linkedin className="w-3 h-3 mr-1" /> LinkedIn
        </Button>
        <Button onClick={copyToClipboard} variant="outline" className="text-[10px] font-mono border-border/30 col-span-2">
          {copied ? <Check className="w-3 h-3 mr-1 text-success" /> : <Copy className="w-3 h-3 mr-1" />}
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>
      </div>
    </div>
  );
};

export default ShareReport;
