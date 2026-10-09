import { TargetRecord, TargetProgress, formatCurrency } from "@/lib/calculations/analytics";
import { format } from "date-fns";
import { Target as TargetIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TargetProgressCardProps {
  target: TargetRecord;
  progress: TargetProgress;
}

export function TargetProgressCard({ target, progress }: TargetProgressCardProps) {
  const progressClamped = Math.min(progress.progressPercent, 100);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <TargetIcon className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-sm">{target.name}</h2>
          <p className="text-xs text-muted-foreground">
            {format(target.startDate, "dd MMM")} — {format(target.endDate, "dd MMM yyyy")}
          </p>
        </div>
        {progress.isExceeded && (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
        )}
      </div>

      {/* Circular Progress */}
      <div className="flex flex-col items-center gap-4 my-4">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progressClamped / 100)}`}
              className={cn(
                "transition-all duration-700",
                progress.isExceeded ? "stroke-emerald-500" : "stroke-purple-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-xl font-bold", progress.isExceeded ? "text-emerald-500" : "text-purple-500")}>
              {progress.progressPercent.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target</span>
          <span className="font-medium">{formatCurrency(progress.targetAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Achieved</span>
          <span className={cn("font-medium", progress.achieved >= 0 ? "text-emerald-500" : "text-red-500")}>
            {formatCurrency(progress.achieved)}
          </span>
        </div>
        {progress.isExceeded ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Exceeded by</span>
            <span className="font-medium text-emerald-500">+{formatCurrency(progress.excess)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pending</span>
            <span className="font-medium text-amber-500">{formatCurrency(progress.pending)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-700",
              progress.isExceeded
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : "bg-gradient-to-r from-purple-600 to-purple-400"
            )}
            style={{ width: `${progressClamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}
