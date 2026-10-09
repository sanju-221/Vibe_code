"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodData {
  period: string;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  trades: number;
  winRate: number;
}

interface PnLBreakdownSectionProps {
  data: PeriodData[];
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

// Bar width as % of max between profit and loss
function barWidth(value: number, max: number) {
  if (max === 0) return 0;
  return Math.min((value / max) * 100, 100);
}

export function PnLBreakdownSection({ data }: PnLBreakdownSectionProps) {
  const [active, setActive] = useState(0);
  const period = data[active];

  const maxBar = Math.max(period.grossProfit, period.grossLoss, 1);
  const net = period.netPnl;
  const isProfit = net > 0;
  const isLoss = net < 0;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="font-semibold text-foreground">Profit & Loss Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gross profit vs gross loss by period</p>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex border-b border-border px-5 gap-1">
        {data.map((d, i) => (
          <button
            key={d.period}
            onClick={() => setActive(i)}
            className={cn(
              "px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px whitespace-nowrap",
              active === i
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {d.period}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-5">
        {/* Three big numbers */}
        <div className="grid grid-cols-3 gap-3">
          {/* Gross Profit */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Gross Profit</span>
            </div>
            <p className="text-xl font-bold text-emerald-500 leading-none">
              {formatInr(period.grossProfit)}
            </p>
            {period.trades > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {period.winRate.toFixed(1)}% win rate
              </p>
            )}
          </div>

          {/* Net P/L — center, larger */}
          <div className={cn(
            "rounded-xl p-4 text-center border",
            isProfit
              ? "bg-emerald-500/10 border-emerald-500/30"
              : isLoss
              ? "bg-red-500/10 border-red-500/30"
              : "bg-muted border-border"
          )}>
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {isProfit
                ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                : isLoss
                ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                : <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className="text-xs font-medium text-muted-foreground">Net P/L</span>
            </div>
            <p className={cn(
              "text-2xl font-bold leading-none",
              isProfit ? "text-emerald-500" : isLoss ? "text-red-500" : "text-muted-foreground"
            )}>
              {isProfit ? "+" : isLoss ? "-" : ""}{formatInr(net)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {period.trades} trade{period.trades !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Gross Loss */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-muted-foreground">Gross Loss</span>
            </div>
            <p className="text-xl font-bold text-red-500 leading-none">
              {period.grossLoss > 0 ? "-" : ""}{formatInr(period.grossLoss)}
            </p>
            {period.trades > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {(100 - period.winRate).toFixed(1)}% loss rate
              </p>
            )}
          </div>
        </div>

        {/* Visual bars */}
        {period.trades > 0 ? (
          <div className="space-y-3">
            {/* Profit bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-emerald-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Profit
                </span>
                <span className="text-muted-foreground">{formatInr(period.grossProfit)}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${barWidth(period.grossProfit, maxBar)}%` }}
                />
              </div>
            </div>

            {/* Loss bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-red-500 flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" /> Loss
                </span>
                <span className="text-muted-foreground">
                  {period.grossLoss > 0 ? "-" : ""}{formatInr(period.grossLoss)}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-700"
                  style={{ width: `${barWidth(period.grossLoss, maxBar)}%` }}
                />
              </div>
            </div>

            {/* Profit factor badge */}
            {period.grossLoss > 0 && (
              <div className="flex justify-end">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  period.grossProfit / period.grossLoss >= 1
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
                )}>
                  Profit Factor: {(period.grossProfit / period.grossLoss).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No trades recorded for this period
          </div>
        )}
      </div>
    </div>
  );
}
