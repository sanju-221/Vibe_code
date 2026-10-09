import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  valueClass?: string;
  icon: LucideIcon;
  iconClass?: string;
  subtitle?: string;
  prefix?: string;
}

export function KpiCard({
  title,
  value,
  valueClass,
  icon: Icon,
  iconClass,
  subtitle,
  prefix = "",
}: KpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          <p className={cn("text-xl font-bold mt-1 truncate", valueClass)}>
            {prefix}{value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0 ml-3",
          )}
        >
          <Icon className={cn("w-5 h-5", iconClass)} />
        </div>
      </div>
    </div>
  );
}
