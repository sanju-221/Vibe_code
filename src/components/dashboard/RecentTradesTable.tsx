import { TradeRecord, TradingDayRecord, calculateDailyStats, formatCurrency, getPnlColor, getPnlSign } from "@/lib/calculations/analytics";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus, Coffee, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";

type DayType = "TRADE" | "NO_TRADE" | "HOLIDAY";

type DayWithTrades = TradingDayRecord & { dayType?: DayType };

interface RecentTradesTableProps {
  days: DayWithTrades[];
}

export function RecentTradesTable({ days }: RecentTradesTableProps) {
  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dateStr  = format(day.tradingDate, "yyyy-MM-dd");
        const dayType  = day.dayType ?? "TRADE";
        const isNoTrade = dayType === "NO_TRADE";
        const isHoliday = dayType === "HOLIDAY";
        const isSpecial = isNoTrade || isHoliday;

        if (isSpecial) {
          return (
            <Link
              key={day.id}
              href={`/trades/${dateStr}`}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg transition-colors group border",
                isHoliday
                  ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10"
                  : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isHoliday ? "bg-emerald-500/15" : "bg-amber-500/15"
                )}>
                  {isHoliday
                    ? <CalendarOff className="w-4 h-4 text-emerald-500" />
                    : <Coffee       className="w-4 h-4 text-amber-500"   />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{format(day.tradingDate, "dd MMM yyyy")}</p>
                  <p className={cn("text-xs font-medium", isHoliday ? "text-emerald-500" : "text-amber-500")}>
                    {isHoliday ? "🏖️ Holiday" : "☕ No Trade"}
                  </p>
                </div>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                isHoliday ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
              )}>
                {isHoliday ? "Holiday" : "No Trade"}
              </span>
            </Link>
          );
        }

        // Normal trade day
        const stats = calculateDailyStats(day.trades as TradeRecord[]);
        const Icon  = stats.netPnl > 0 ? ArrowUpRight : stats.netPnl < 0 ? ArrowDownRight : Minus;

        return (
          <Link
            key={day.id}
            href={`/trades/${dateStr}`}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                stats.netPnl > 0 ? "bg-emerald-500/10" : stats.netPnl < 0 ? "bg-red-500/10" : "bg-slate-500/10"
              )}>
                <Icon className={cn(
                  "w-4 h-4",
                  stats.netPnl > 0 ? "text-emerald-500" : stats.netPnl < 0 ? "text-red-500" : "text-slate-400"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{format(day.tradingDate, "dd MMM yyyy")}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTrades} trades · {stats.winRate.toFixed(0)}% win rate
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-sm font-bold", getPnlColor(stats.netPnl))}>
                {getPnlSign(stats.netPnl)}{formatCurrency(Math.abs(stats.netPnl))}
              </p>
              <p className="text-xs text-muted-foreground">{stats.winningTrades}W · {stats.losingTrades}L</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
