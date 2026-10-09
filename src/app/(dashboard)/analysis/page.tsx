import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import {
  calculateDailyStats,
  calculateStockStats,
  calculateBuySellStats,
  formatCurrency,
  formatPercent,
  getPnlColor,
  getPnlSign,
} from "@/lib/calculations/analytics";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, format,
} from "date-fns";
import { TradeRecord } from "@/lib/calculations/analytics";
import { AnalysisClient } from "@/components/analysis/AnalysisClient";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const period = params.period || "MONTH";
  const now = new Date();

  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case "DAY":
      startDate = new Date(now.toDateString());
      endDate = new Date(now.toDateString());
      break;
    case "WEEK":
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "YEAR":
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    case "OVERALL":
      startDate = new Date("2000-01-01");
      endDate = new Date("2099-12-31");
      break;
    default: // MONTH
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
  }

  const tradingDays = await prisma.tradingDay.findMany({
    where: {
      userId: session.user.id,
      tradingDate: { gte: startDate, lte: endDate },
    },
    include: { trades: true },
    orderBy: { tradingDate: "asc" },
  });

  interface TradingDayWithTrades { tradingDate: Date; trades: TradeRecord[] }
  const typedDays = tradingDays as unknown as TradingDayWithTrades[];

  const allTrades: TradeRecord[] = typedDays.flatMap((d) => d.trades);
  const stats = calculateDailyStats(allTrades);
  const stockStats = calculateStockStats(allTrades);
  const buySellStats = calculateBuySellStats(allTrades);

  // Daily breakdown for charts
  const dailyBreakdown = typedDays.map((day) => {
    const s = calculateDailyStats(day.trades);
    return {
      date: format(day.tradingDate, "dd MMM"),
      pnl: s.netPnl,
      trades: day.trades.length,
      wins: s.winningTrades,
      losses: s.losingTrades,
    };
  });

  // Cumulative P/L
  const cumulativePnl = dailyBreakdown.reduce<{ date: string; cumPnl: number }[]>((acc, d) => {
    const prev = acc.length ? acc[acc.length - 1].cumPnl : 0;
    acc.push({ date: d.date, cumPnl: prev + d.pnl });
    return acc;
  }, []);

  return (
    <AnalysisClient
      period={period}
      stats={stats}
      stockStats={stockStats}
      buySellStats={buySellStats}
      dailyBreakdown={dailyBreakdown}
      cumulativePnl={cumulativePnl}
      tradingDaysCount={tradingDays.length}
      startDate={format(startDate, "dd MMM yyyy")}
      endDate={format(endDate, "dd MMM yyyy")}
    />
  );
}
