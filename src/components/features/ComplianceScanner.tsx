import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ComplianceItem {
  regulation: string;
  requirement: string;
  status: "pass" | "fail" | "warning";
  fix?: string;
}

interface Props { items: ComplianceItem[]; }

const statusIcons = {
  pass: <CheckCircle className="w-3 h-3 text-success" />,
  fail: <XCircle className="w-3 h-3 text-destructive" />,
  warning: <AlertTriangle className="w-3 h-3 text-warning" />,
};

const ComplianceScanner = ({ items }: Props) => {
  if (items.length === 0) return <p className="text-[9px] font-mono text-muted-foreground text-center py-4">Run compliance scan to check against regulations</p>;
  const passed = items.filter(i => i.status === "pass").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-success">{passed}/{items.length} passing</span>
        <span className="text-destructive">{items.filter(i => i.status === "fail").length} failures</span>
      </div>
      <div className="space-y-1 max-h-[250px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="bg-muted/20 rounded p-2">
            <div className="flex items-center gap-2">
              {statusIcons[item.status]}
              <span className="text-[10px] font-mono font-semibold flex-1">{item.regulation}</span>
            </div>
            <p className="text-[9px] font-mono text-muted-foreground mt-1">{item.requirement}</p>
            {item.fix && <p className="text-[9px] font-mono text-primary mt-1">Fix: {item.fix}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplianceScanner;
export type { ComplianceItem };
