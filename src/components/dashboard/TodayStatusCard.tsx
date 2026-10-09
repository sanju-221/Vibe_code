"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Trade {
  id: string;
  tradeNumber: number;
  stockName: string;
  tradeType: "BUY" | "SELL";
  profitLoss: number;
  amount: number;
}

interface TodayStatusCardProps {
  trades: Trade[];
  date: Date;
  userName: string;
}

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

type Filter = "all" | "profit" | "loss";

export function TodayStatusCard({ trades, date, userName }: TodayStatusCardProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const profitTrades = trades.filter((t) => t.profitLoss > 0);
  const lossTrades   = trades.filter((t) => t.profitLoss < 0);
  const totalProfit  = profitTrades.reduce((s, t) => s + t.profitLoss, 0);
  const totalLoss    = lossTrades.reduce((s, t) => s + t.profitLoss, 0);
  const netPnl       = trades.reduce((s, t) => s + t.profitLoss, 0);

  const isUp   = netPnl > 0;
  const isDown = netPnl < 0;

  const shownTrades =
    filter === "profit" ? profitTrades :
    filter === "loss"   ? lossTrades   :
    trades;

  const greeting =
    date.getHours() < 12 ? "Good Morning" :
    date.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Top gradient strip */}
      <div className={cn(
        "h-1.5 w-full",
        isUp   ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
        isDown ? "bg-gradient-to-r from-red-500 to-red-400"         :
                 "bg-gradient-to-r from-slate-400 to-slate-300"
      )} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {greeting}, <span className="font-medium text-foreground">{userName}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(date, "EEEE, dd MMMM yyyy")}
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            Today
          </span>
        </div>

        {/* Big net P/L */}
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
            isUp   ? "bg-emerald-500/10" :
            isDown ? "bg-red-500/10"     : "bg-muted"
          )}>
            {isUp   ? <TrendingUp  className="w-6 h-6 text-emerald-500" /> :
             isDown ? <TrendingDown className="w-6 h-6 text-red-500"     /> :
                      <Minus        className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Today&apos;s Net P/L</p>
            <p className={cn(
              "text-3xl font-bold tracking-tight",
              isUp   ? "text-emerald-500" :
              isDown ? "text-red-500"     : "text-muted-foreground"
            )}>
              {isUp ? "+" : isDown ? "-" : ""}{formatInr(netPnl)}
            </p>
          </div>
        </div>

        {/* PROFIT / LOSS toggle buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* PROFIT button */}
          <button
            onClick={() => setFilter(filter === "profit" ? "all" : "profit")}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 py-3.5 rounded-xl border-2 font-semibold transition-all duration-200",
              filter === "profit"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10"
                : "border-border bg-background hover:border-emerald-500/40 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-600"
            )}
          >
            <TrendingUp className={cn(
              "w-5 h-5 transition-colors",
              filter === "profit" ? "text-emerald-500" : "text-muted-foreground"
            )} />
            <span className="text-xs">PROFIT</span>
            <span className={cn(
              "text-lg font-bold leading-none",
              filter === "profit" ? "text-emerald-500" : "text-foreground"
            )}>
              {totalProfit > 0 ? "+" : ""}{formatInr(totalProfit)}
            </span>
            <span className="text-xs text-muted-foreground">
              {profitTrades.length} trade{profitTrades.length !== 1 ? "s" : ""}
            </span>
            {filter === "profit" && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* LOSS button */}
          <button
            onClick={() => setFilter(filter === "loss" ? "all" : "loss")}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 py-3.5 rounded-xl border-2 font-semibold transition-all duration-200",
              filter === "loss"
                ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-md shadow-red-500/10"
                : "border-border bg-background hover:border-red-500/40 hover:bg-red-500/5 text-muted-foreground hover:text-red-600"
            )}
          >
            <TrendingDown className={cn(
              "w-5 h-5 transition-colors",
              filter === "loss" ? "text-red-500" : "text-muted-foreground"
            )} />
            <span className="text-xs">LOSS</span>
            <span className={cn(
              "text-lg font-bold leading-none",
              filter === "loss" ? "text-red-500" : "text-foreground"
            )}>
              {totalLoss < 0 ? "-" : ""}{formatInr(totalLoss)}
            </span>
            <span className="text-xs text-muted-foreground">
              {lossTrades.length} trade{lossTrades.length !== 1 ? "s" : ""}
            </span>
            {filter === "loss" && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        {/* Trade list — shown when a filter is active */}
        {filter !== "all" && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {filter === "profit" ? "✅ Profitable Trades" : "❌ Loss Trades"} — Today
            </p>

            {shownTrades.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No {filter} trades today
              </div>
            ) : (
              shownTrades.map((trade) => (
                <div
                  key={trade.id}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all",
                    trade.profitLoss > 0
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-red-500/5 border-red-500/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                      trade.profitLoss > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600"
                    )}>
                      #{trade.tradeNumber}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{trade.stockName}</p>
                      <p className="text-xs text-muted-foreground">{trade.tradeType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      trade.profitLoss > 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {trade.profitLoss > 0 ? "+" : "-"}{formatInr(trade.profitLoss)}
                    </p>
                    <p className="text-xs text-muted-foreground">Amt: {formatInr(trade.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* No trades today */}
        {trades.length === 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">No trades recorded today</p>
            <Link
              href="/trades/new"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:underline font-medium"
            >
              Add today&apos;s trades <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Footer stats when showing all */}
        {filter === "all" && trades.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border mt-1">
            <span>{trades.length} total trades</span>
            <span>{profitTrades.length}W · {lossTrades.length}L</span>
            <Link href="/trades/new" className="text-primary hover:underline font-medium">
              + Add more
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
