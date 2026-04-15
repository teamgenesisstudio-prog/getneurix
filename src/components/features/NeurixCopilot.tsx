import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (message: string) => Promise<string>;
  isLoading: boolean;
}

const NeurixCopilot = ({ onSend, isLoading }: Props) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "I'm NEURIX Copilot. I can explain failures, suggest fixes, and help improve your model. What would you like to fix?" }
  ]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    try {
      const response = await onSend(msg);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="max-h-64 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`rounded p-2 text-[10px] font-mono ${m.role === "user" ? "bg-primary/10 text-primary ml-6" : "bg-muted/30 text-foreground mr-4"}`}>
            <span className="text-[8px] text-muted-foreground">{m.role === "user" ? "YOU" : "COPILOT"}</span>
            <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {isLoading && <div className="text-[10px] font-mono text-primary animate-pulse"><Bot className="w-3 h-3 inline mr-1" />Analyzing...</div>}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Describe a problem to fix..." className="flex-1 bg-muted/30 border border-border/30 rounded px-3 py-2 text-[10px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        <Button onClick={send} disabled={isLoading || !input.trim()} size="sm" className="bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30">
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default NeurixCopilot;
