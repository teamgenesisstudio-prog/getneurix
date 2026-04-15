import { useState } from "react";
import { BookOpen, Code2 } from "lucide-react";

interface Props { technical: string; simple: string; }

const ELI5Toggle = ({ technical, simple }: Props) => {
  const [mode, setMode] = useState<"technical" | "eli5">("technical");

  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-muted/30 rounded p-0.5">
        <button onClick={() => setMode("technical")} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-mono transition-all ${mode === "technical" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
          <Code2 className="w-3 h-3" /> Technical
        </button>
        <button onClick={() => setMode("eli5")} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-mono transition-all ${mode === "eli5" ? "bg-success/20 text-success" : "text-muted-foreground"}`}>
          <BookOpen className="w-3 h-3" /> Plain English
        </button>
      </div>
      <div className="bg-muted/20 rounded p-3 text-[10px] font-mono whitespace-pre-wrap">
        {mode === "technical" ? technical : simple}
      </div>
    </div>
  );
};

export default ELI5Toggle;
