import { ReactNode } from "react";

interface NeurixPanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  badge?: string;
  className?: string;
}

const NeurixPanel = ({ title, icon, children, badge, className = "" }: NeurixPanelProps) => (
  <div className={`glass-panel rounded-lg overflow-hidden ${className}`}>
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
      {icon}
      <h3 className="font-display text-xs font-semibold tracking-widest uppercase text-foreground">{title}</h3>
      {badge && (
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
          {badge}
        </span>
      )}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default NeurixPanel;
