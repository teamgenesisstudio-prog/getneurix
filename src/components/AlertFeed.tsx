import { useEffect, useState } from "react";
import { Bell, AlertCircle, CheckCircle, Info } from "lucide-react";

export interface Alert {
  id: string;
  type: "error" | "success" | "info" | "warning";
  message: string;
  timestamp: Date;
}

interface AlertFeedProps {
  alerts: Alert[];
}

const typeStyles = {
  error: { icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-destructive" },
  success: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-success" },
  info: { icon: <Info className="w-3.5 h-3.5" />, color: "text-primary" },
  warning: { icon: <Bell className="w-3.5 h-3.5" />, color: "text-warning" },
};

const AlertFeed = ({ alerts }: AlertFeedProps) => {
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    const ids = alerts.map((a) => a.id);
    setVisible(ids);
  }, [alerts]);

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
      {alerts.length === 0 && (
        <p className="text-muted-foreground text-xs font-mono text-center py-4">
          Monitoring... No alerts yet.
        </p>
      )}
      {alerts.map((alert) => {
        const style = typeStyles[alert.type];
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-2 p-2 rounded bg-muted/50 animate-slide-up ${
              visible.includes(alert.id) ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className={`mt-0.5 ${style.color}`}>{style.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono truncate">{alert.message}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {alert.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertFeed;
