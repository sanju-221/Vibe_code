import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { calculateDailyStats, formatCurrency, getPnlColor, getPnlSign } from "@/lib/calculations/analytics";
import { format } from "date-fns";
import { TradeDetailClient } from "@/components/trades/TradeDetailClient";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface DatePageProps {
  params: Promise<{ date: string }>;
}

export default async function DatePage({ params }: DatePageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { date } = await params;
  const tradingDate = new Date(date + "T00:00:00.000Z");

  if (isNaN(tradingDate.getTime())) notFound();

  const tradingDay = await prisma.tradingDay.findUnique({
    where: {
      userId_tradingDate: {
        userId: session.user.id,
        tradingDate,
      },
    },
    include: {
      trades: { orderBy: { tradeNumber: "asc" } },
    },
  });

  if (!tradingDay) notFound();

  const stats = calculateDailyStats(tradingDay.trades);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/trades"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to History
      </Link>

      {/* Date Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {format(tradingDay.tradingDate, "dd MMMM yyyy")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {stats.totalTrades} trades recorded
        </p>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Net P/L</p>
          <p className={cn("text-2xl font-bold mt-1", getPnlColor(stats.netPnl))}>
            {getPnlSign(stats.netPnl)}{formatCurrency(Math.abs(stats.netPnl))}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
          <p className={cn("text-2xl font-bold mt-1", stats.winRate >= 50 ? "text-emerald-500" : "text-red-500")}>
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">{stats.winningTrades}W · {stats.losingTrades}L</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gross Profit</p>
          <p className="text-2xl font-bold mt-1 text-emerald-500">
            {formatCurrency(stats.grossProfit)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gross Loss</p>
          <p className="text-2xl font-bold mt-1 text-red-500">
            {formatCurrency(stats.grossLoss)}
          </p>
        </div>
      </div>

      {/* Additional stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Best Trade</p>
          <p className="text-lg font-bold mt-1 text-emerald-500">
            +{formatCurrency(stats.bestTrade)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Worst Trade</p>
          <p className="text-lg font-bold mt-1 text-red-500">
            {formatCurrency(stats.worstTrade)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Win</p>
          <p className="text-lg font-bold mt-1 text-emerald-500">
            +{formatCurrency(stats.averageWin)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount Traded</p>
          <p className="text-lg font-bold mt-1">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>
      </div>

      {/* Trade List (Client Component for edit/delete) */}
      <TradeDetailClient
        trades={tradingDay.trades}
        tradingDayId={tradingDay.id}
        dateStr={date}
      />
    </div>
  );
}
