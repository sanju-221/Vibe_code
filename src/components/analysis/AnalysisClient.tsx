"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { DailyStats, StockStats, BuySellStats, formatCurrency, formatPercent, getPnlColor, getPnlSign } from "@/lib/calculations/analytics";
import { MonthlyPnLChart } from "@/components/charts/MonthlyPnLChart";
import { WinLossDonut } from "@/components/charts/WinLossDonut";
import { CumulativePnLChart } from "@/components/charts/CumulativePnLChart";
import { StockPnLChart } from "@/components/charts/StockPnLChart";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Activity, BarChart3,
  Target, Zap, ArrowUpRight, ArrowDownRight, Calendar,
  ShoppingBag, Tag
} from "lucide-react";

interface AnalysisClientProps {
  period: string;
  stats: DailyStats;
  stockStats: StockStats[];
  buySellStats: BuySellStats;
  dailyBreakdown: { date: string; pnl: number; trades: number; wins: number; losses: number }[];
  cumulativePnl: { date: string; cumPnl: number }[];
  tradingDaysCount: number;
  startDate: string;
  endDate: string;
}

const PERIODS = [
  { label: "Day", value: "DAY" },
  { label: "Week", value: "WEEK" },
  { label: "Month", value: "MONTH" },
  { label: "Year", value: "YEAR" },
  { label: "Overall", value: "OVERALL" },
];

function StatCard({ label, value, valueClass, sub }: { label: string; value: string; valueClass?: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-xl font-bold mt-1", valueClass)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function AnalysisClient({
  period,
  stats,
  stockStats,
  buySellStats,
  dailyBreakdown,
  cumulativePnl,
  tradingDaysCount,
  startDate,
  endDate,
}: AnalysisClientProps) {
  const router = useRouter();

  const handlePeriodChange = (p: string) => {
    router.push(`/analysis?period=${p}`);
  };

  const hasData = stats.totalTrades > 0;
  const profitFactorDisplay =
    stats.profitFactor === Infinity ? "∞" :
    stats.profitFactor === 0 ? "N/A" :
    stats.profitFactor.toFixed(2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {startDate} — {endDate}
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handlePeriodChange(value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              period === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No trading data for this period</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Add trades for this period to see analytics.
          </p>
          <Link href="/trades/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
            Add Trade
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              label="Net P/L"
              value={`${getPnlSign(stats.netPnl)}${formatCurrency(Math.abs(stats.netPnl))}`}
              valueClass={getPnlColor(stats.netPnl)}
            />
            <StatCard
              label="Win Rate"
              value={formatPercent(stats.winRate)}
              valueClass={stats.winRate >= 50 ? "text-emerald-500" : "text-red-500"}
              sub={`${stats.winningTrades}W · ${stats.losingTrades}L · ${stats.breakevenTrades}B`}
            />
            <StatCard
              label="Total Trades"
              value={stats.totalTrades.toString()}
              sub={`${tradingDaysCount} trading days`}
            />
            <StatCard
              label="Profit Factor"
              value={profitFactorDisplay}
              valueClass={stats.profitFactor >= 1.5 ? "text-emerald-500" : stats.profitFactor >= 1 ? "text-amber-500" : "text-red-500"}
            />
            <StatCard
              label="Gross Profit"
              value={formatCurrency(stats.grossProfit)}
              valueClass="text-emerald-500"
            />
            <StatCard
              label="Gross Loss"
              value={formatCurrency(stats.grossLoss)}
              valueClass="text-red-500"
            />
            <StatCard
              label="Avg Win"
              value={formatCurrency(stats.averageWin)}
              valueClass="text-emerald-500"
            />
            <StatCard
              label="Avg Loss"
              value={formatCurrency(stats.averageLoss)}
              valueClass="text-red-500"
            />
            <StatCard
              label="Best Trade"
              value={`+${formatCurrency(stats.bestTrade)}`}
              valueClass="text-emerald-500"
            />
            <StatCard
              label="Worst Trade"
              value={formatCurrency(stats.worstTrade)}
              valueClass="text-red-500"
            />
            <StatCard
              label="Expectancy"
              value={`${getPnlSign(stats.expectancy)}${formatCurrency(Math.abs(stats.expectancy))}`}
              valueClass={getPnlColor(stats.expectancy)}
              sub="per trade"
            />
            <StatCard
              label="Amount Traded"
              value={formatCurrency(stats.totalAmount)}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-foreground mb-4">Daily P/L</h2>
              <MonthlyPnLChart data={dailyBreakdown} />
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-foreground mb-4">Win / Loss Distribution</h2>
              <WinLossDonut
                winning={stats.winningTrades}
                losing={stats.losingTrades}
                breakeven={stats.breakevenTrades}
              />
            </div>
          </div>

          {/* Cumulative P/L Chart */}
          {cumulativePnl.length > 1 && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-foreground mb-4">Cumulative P/L</h2>
              <CumulativePnLChart data={cumulativePnl} />
            </div>
          )}

          {/* BUY vs SELL */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-5">BUY vs SELL Analysis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* BUY */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <h3 className="font-semibold text-blue-500">BUY</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Trades", buySellStats.buy.trades.toString()],
                    ["Wins", buySellStats.buy.wins.toString()],
                    ["Losses", buySellStats.buy.losses.toString()],
                    ["Win Rate", formatPercent(buySellStats.buy.winRate)],
                    ["Net P/L", `${getPnlSign(buySellStats.buy.netPnl)}${formatCurrency(Math.abs(buySellStats.buy.netPnl))}`],
                    ["Avg P/L", `${getPnlSign(buySellStats.buy.averagePnl)}${formatCurrency(Math.abs(buySellStats.buy.averagePnl))}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={cn("font-medium", k.includes("P/L") ? getPnlColor(buySellStats.buy.netPnl) : "")}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Visual bar */}
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Net P/L share</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                      style={{
                        width: `${buySellStats.buy.trades + buySellStats.sell.trades > 0
                          ? (buySellStats.buy.trades / (buySellStats.buy.trades + buySellStats.sell.trades)) * 100
                          : 50}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SELL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <h3 className="font-semibold text-purple-500">SELL</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Trades", buySellStats.sell.trades.toString()],
                    ["Wins", buySellStats.sell.wins.toString()],
                    ["Losses", buySellStats.sell.losses.toString()],
                    ["Win Rate", formatPercent(buySellStats.sell.winRate)],
                    ["Net P/L", `${getPnlSign(buySellStats.sell.netPnl)}${formatCurrency(Math.abs(buySellStats.sell.netPnl))}`],
                    ["Avg P/L", `${getPnlSign(buySellStats.sell.averagePnl)}${formatCurrency(Math.abs(buySellStats.sell.averagePnl))}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={cn("font-medium", k.includes("P/L") ? getPnlColor(buySellStats.sell.netPnl) : "")}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Net P/L share</div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500 transition-all duration-700"
                      style={{
                        width: `${buySellStats.buy.trades + buySellStats.sell.trades > 0
                          ? (buySellStats.sell.trades / (buySellStats.buy.trades + buySellStats.sell.trades)) * 100
                          : 50}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Performance */}
          {stockStats.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-foreground mb-5">Stock Performance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div>
                  <StockPnLChart
                    data={stockStats.slice(0, 10).map((s) => ({
                      stockName: s.stockName,
                      netPnl: s.netPnl,
                      trades: s.trades,
                    }))}
                  />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                        <th className="text-left pb-2">Stock</th>
                        <th className="text-center pb-2">Trades</th>
                        <th className="text-center pb-2">W/L</th>
                        <th className="text-right pb-2">Net P/L</th>
                        <th className="text-right pb-2">Win%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stockStats.map((s) => (
                        <tr key={s.stockName} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2 font-semibold text-foreground">{s.stockName}</td>
                          <td className="py-2 text-center text-muted-foreground">{s.trades}</td>
                          <td className="py-2 text-center text-muted-foreground">
                            <span className="text-emerald-500">{s.wins}</span>
                            /
                            <span className="text-red-500">{s.losses}</span>
                          </td>
                          <td className={cn("py-2 text-right font-bold", getPnlColor(s.netPnl))}>
                            {getPnlSign(s.netPnl)}{formatCurrency(Math.abs(s.netPnl))}
                          </td>
                          <td className={cn("py-2 text-right", s.winRate >= 50 ? "text-emerald-500" : "text-red-500")}>
                            {formatPercent(s.winRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
