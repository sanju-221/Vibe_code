import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TradeRecord, TradingDayRecord,
  calculateDailyStats, calculateTargetProgress,
  formatCurrency, getPnlColor, getPnlSign
} from "@/lib/calculations/analytics";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RecentTradesTable } from "@/components/dashboard/RecentTradesTable";
import { TargetProgressCard } from "@/components/dashboard/TargetProgressCard";
import { MonthlyPnLChart } from "@/components/charts/MonthlyPnLChart";
import { WinLossDonut } from "@/components/charts/WinLossDonut";
import { PnLBreakdownSection } from "@/components/dashboard/PnLBreakdownSection";
import { TodayStatusCard } from "@/components/dashboard/TodayStatusCard";
import {
  TrendingUp, TrendingDown, Activity, Award,
  Target, BarChart3, Calendar, Zap
} from "lucide-react";
import { format } from "date-fns";
import {
  utcStartOfDay, utcEndOfDay,
  utcStartOfWeek, utcEndOfWeek,
  utcStartOfMonth, utcEndOfMonth,
  utcStartOfYear, utcEndOfYear,
} from "@/lib/utils/date-boundaries";

async function getDashboardData(userId: string) {
  const now = new Date();

  const [todayTrades, weekTrades, monthTrades, yearTrades, allTrades, activeTargets, recentDays] =
    await Promise.all([
      prisma.trade.findMany({
        where: { tradingDay: { userId, tradingDate: { gte: utcStartOfDay(now), lte: utcEndOfDay(now) } } },
      }),
      prisma.trade.findMany({
        where: { tradingDay: { userId, tradingDate: { gte: utcStartOfWeek(now), lte: utcEndOfWeek(now) } } },
      }),
      prisma.trade.findMany({
        where: { tradingDay: { userId, tradingDate: { gte: utcStartOfMonth(now), lte: utcEndOfMonth(now) } } },
      }),
      prisma.trade.findMany({
        where: { tradingDay: { userId, tradingDate: { gte: utcStartOfYear(now), lte: utcEndOfYear(now) } } },
      }),
      prisma.trade.findMany({ where: { tradingDay: { userId } } }),
      prisma.target.findMany({
        where: { userId, endDate: { gte: now } },
        orderBy: { endDate: "asc" },
      }),
      prisma.tradingDay.findMany({
        where: { userId },
        include: { trades: true },
        orderBy: { tradingDate: "desc" },
        take: 7,
      }),
    ]);

  return { todayTrades, weekTrades, monthTrades, yearTrades, allTrades, activeTargets, recentDays };

}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const { todayTrades, weekTrades, monthTrades, yearTrades, allTrades, activeTargets, recentDays } =
    await getDashboardData(userId);

  const todayStats   = calculateDailyStats(todayTrades);
  const weekStats    = calculateDailyStats(weekTrades);
  const monthStats   = calculateDailyStats(monthTrades);
  const yearStats    = calculateDailyStats(yearTrades);
  const allStats     = calculateDailyStats(allTrades);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good Morning" :
    now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  const monthlyChartData = recentDays
    .slice()
    .reverse()
    .map((day: TradingDayRecord) => {
      const s = calculateDailyStats(day.trades as TradeRecord[]);
      return { date: format(day.tradingDate, "dd MMM"), pnl: s.netPnl, trades: day.trades.length };
    });

  const primaryTarget = activeTargets[0] || null;
  let targetProgress = null;
  if (primaryTarget) {
    const targetTrades = await prisma.trade.findMany({
      where: {
        tradingDay: {
          userId,
          tradingDate: { gte: primaryTarget.startDate, lte: primaryTarget.endDate },
        },
      },
    });
    const achieved = targetTrades.reduce((s: number, t: TradeRecord) => s + t.profitLoss, 0);
    targetProgress = calculateTargetProgress(primaryTarget.targetAmount, achieved);
  }

  // ── P&L breakdown data for all periods ──────────────────────────────────────
  const pnlBreakdown = [
    {
      period: "Today",
      grossProfit: todayStats.grossProfit,
      grossLoss: todayStats.grossLoss,
      netPnl: todayStats.netPnl,
      trades: todayStats.totalTrades,
      winRate: todayStats.winRate,
    },
    {
      period: "This Week",
      grossProfit: weekStats.grossProfit,
      grossLoss: weekStats.grossLoss,
      netPnl: weekStats.netPnl,
      trades: weekStats.totalTrades,
      winRate: weekStats.winRate,
    },
    {
      period: "This Month",
      grossProfit: monthStats.grossProfit,
      grossLoss: monthStats.grossLoss,
      netPnl: monthStats.netPnl,
      trades: monthStats.totalTrades,
      winRate: monthStats.winRate,
    },
    {
      period: "This Year",
      grossProfit: yearStats.grossProfit,
      grossLoss: yearStats.grossLoss,
      netPnl: yearStats.netPnl,
      trades: yearStats.totalTrades,
      winRate: yearStats.winRate,
    },
    {
      period: "Overall",
      grossProfit: allStats.grossProfit,
      grossLoss: allStats.grossLoss,
      netPnl: allStats.netPnl,
      trades: allStats.totalTrades,
      winRate: allStats.winRate,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── TODAY'S STATUS — first thing you see ── */}
      <TodayStatusCard
        trades={todayTrades}
        date={now}
        userName={session.user.name ?? "Trader"}
      />

      {/* KPI Cards — Row 1: Net P/L by period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Today's P/L"
          value={formatCurrency(todayStats.netPnl)}
          valueClass={getPnlColor(todayStats.netPnl)}
          icon={todayStats.netPnl >= 0 ? TrendingUp : TrendingDown}
          iconClass={todayStats.netPnl >= 0 ? "text-emerald-500" : "text-red-500"}
          subtitle={`${todayStats.totalTrades} trades`}
          prefix={getPnlSign(todayStats.netPnl)}
        />
        <KpiCard
          title="This Week"
          value={formatCurrency(weekStats.netPnl)}
          valueClass={getPnlColor(weekStats.netPnl)}
          icon={Calendar}
          iconClass="text-blue-500"
          subtitle={`${weekStats.totalTrades} trades`}
          prefix={getPnlSign(weekStats.netPnl)}
        />
        <KpiCard
          title="This Month"
          value={formatCurrency(monthStats.netPnl)}
          valueClass={getPnlColor(monthStats.netPnl)}
          icon={BarChart3}
          iconClass="text-purple-500"
          subtitle={`${monthStats.totalTrades} trades`}
          prefix={getPnlSign(monthStats.netPnl)}
        />
        <KpiCard
          title="This Year"
          value={formatCurrency(yearStats.netPnl)}
          valueClass={getPnlColor(yearStats.netPnl)}
          icon={Award}
          iconClass="text-amber-500"
          subtitle={`${yearStats.totalTrades} trades`}
          prefix={getPnlSign(yearStats.netPnl)}
        />
      </div>

      {/* KPI Cards — Row 2: totals & performance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Trades"
          value={allStats.totalTrades.toString()}
          icon={Activity}
          iconClass="text-indigo-500"
          subtitle={`${allStats.winningTrades}W / ${allStats.losingTrades}L`}
        />
        <KpiCard
          title="Win Rate"
          value={`${allStats.winRate.toFixed(1)}%`}
          valueClass={allStats.winRate >= 50 ? "text-emerald-500" : "text-red-500"}
          icon={Target}
          iconClass="text-emerald-500"
          subtitle="Overall"
        />
        <KpiCard
          title="Avg Trade"
          value={formatCurrency(allStats.totalTrades > 0 ? allStats.netPnl / allStats.totalTrades : 0)}
          valueClass={getPnlColor(allStats.totalTrades > 0 ? allStats.netPnl / allStats.totalTrades : 0)}
          icon={Zap}
          iconClass="text-yellow-500"
          subtitle="Per trade"
        />
        <KpiCard
          title="Overall P/L"
          value={formatCurrency(allStats.netPnl)}
          valueClass={getPnlColor(allStats.netPnl)}
          icon={TrendingUp}
          iconClass="text-indigo-500"
          subtitle="All time"
          prefix={getPnlSign(allStats.netPnl)}
        />
      </div>

      {/* ── Profit & Loss Breakdown ── */}
      <PnLBreakdownSection data={pnlBreakdown} />

      {/* Charts + Target Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Performance</h2>
            <span className="text-xs text-muted-foreground">Last 7 trading days</span>
          </div>
          {monthlyChartData.length > 0 ? (
            <MonthlyPnLChart data={monthlyChartData} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No trading data yet</p>
              <p className="text-muted-foreground text-xs mt-1">Add your first trading day to see charts</p>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Win / Loss</h2>
            <span className="text-xs text-muted-foreground">Overall</span>
          </div>
          {allStats.totalTrades > 0 ? (
            <WinLossDonut
              winning={allStats.winningTrades}
              losing={allStats.losingTrades}
              breakeven={allStats.breakevenTrades}
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No data</p>
            </div>
          )}
        </div>
      </div>

      {/* Target Progress + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {primaryTarget && targetProgress ? (
            <TargetProgressCard target={primaryTarget} progress={targetProgress} />
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm h-full flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">No Active Target</p>
                <p className="text-muted-foreground text-sm mt-1">Create a target to track your progress</p>
              </div>
              <Link href="/targets" className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg text-sm font-medium transition-colors">
                Create Target
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Trading Days</h2>
            <Link href="/trades" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentDays.length > 0 ? (
            <RecentTradesTable days={recentDays} />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center gap-3">
              <Calendar className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No trading days recorded yet</p>
              <Link href="/trades/new" className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors">
                Add Your First Trade
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
