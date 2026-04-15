import { useState, useEffect } from "react";
import { Wifi, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueuedTest { id: string; type: string; data: string; addedAt: Date; }

interface Props { onSync: (tests: QueuedTest[]) => void; }

const OfflineQueue = ({ onSync }: Props) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedTest[]>([]);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      onSync(queue);
      setQueue([]);
    }
  }, [isOnline, queue, onSync]);

  const addToQueue = () => {
    setQueue(prev => [...prev, { id: `q-${Date.now()}`, type: "stress-test", data: "Queued offline", addedAt: new Date() }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {isOnline ? <Wifi className="w-3 h-3 text-success" /> : <WifiOff className="w-3 h-3 text-destructive" />}
        <span className="text-[10px] font-mono">{isOnline ? "Online" : "Offline"}</span>
        {queue.length > 0 && <span className="text-[10px] font-mono text-warning">{queue.length} queued</span>}
      </div>
      {!isOnline && (
        <Button onClick={addToQueue} variant="outline" className="w-full text-[10px] font-mono border-border/30">
          <Clock className="w-3 h-3 mr-1" /> Queue Test for Sync
        </Button>
      )}
      {queue.length > 0 && (
        <div className="space-y-1">
          {queue.map(q => (
            <div key={q.id} className="flex items-center gap-2 bg-muted/20 rounded p-2 text-[9px] font-mono">
              <Clock className="w-3 h-3 text-warning" />
              <span>{q.type}</span>
              <span className="text-muted-foreground">{q.addedAt.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
      {isOnline && queue.length === 0 && <p className="text-[9px] font-mono text-muted-foreground">All tests run in real-time when online.</p>}
    </div>
  );
};

export default OfflineQueue;
