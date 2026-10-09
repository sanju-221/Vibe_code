// Local trade type — mirrors the Prisma schema Trade model
// This avoids dependency on generated Prisma types before database setup

export interface TradeRecord {
  id: string;
  tradingDayId: string;
  tradeNumber: number;
  stockName: string;
  tradeType: "BUY" | "SELL";
  buyPoint: number | null;
  sellPoint: number | null;
  profitLoss: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingDayRecord {
  id: string;
  userId: string;
  tradingDate: Date;
  createdAt: Date;
  updatedAt: Date;
  trades: TradeRecord[];
}

export interface TargetRecord {
  id: string;
  userId: string;
  name: string;
  targetType: "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  startDate: Date;
  endDate: Date;
  targetAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  totalAmount: number;
  profitFactor: number;
  expectancy: number;
}

export interface StockStats {
  stockName: string;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  netPnl: number;
  averagePnl: number;
  totalAmount: number;
}

export interface BuySellStats {
  buy: {
    trades: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    netPnl: number;
    averagePnl: number;
  };
  sell: {
    trades: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    netPnl: number;
    averagePnl: number;
  };
}

export interface DailyBreakdown {
  date: string;
  trades: number;
  netPnl: number;
  wins: number;
  losses: number;
}

export interface TargetProgress {
  targetAmount: number;
  achieved: number;
  pending: number;
  excess: number;
  progressPercent: number;
  isExceeded: boolean;
}

// ─── Core analytics functions ───────────────────────────────────────────────

export function calculateDailyStats(trades: TradeRecord[]): DailyStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnl: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      bestTrade: 0,
      worstTrade: 0,
      totalAmount: 0,
      profitFactor: 0,
      expectancy: 0,
    };
  }

  const winningTrades = trades.filter((t) => t.profitLoss > 0);
  const losingTrades = trades.filter((t) => t.profitLoss < 0);
  const breakevenTrades = trades.filter((t) => t.profitLoss === 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
  const grossLoss = Math.abs(
    losingTrades.reduce((sum, t) => sum + t.profitLoss, 0)
  );
  const netPnl = grossProfit - grossLoss;

  const totalDecisive = winningTrades.length + losingTrades.length;
  const winRate =
    totalDecisive > 0 ? (winningTrades.length / totalDecisive) * 100 : 0;
  const lossRate = 100 - winRate;

  const averageWin =
    winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const averageLoss =
    losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const expectancy =
    (winRate / 100) * averageWin - (lossRate / 100) * averageLoss;

  const pnlValues = trades.map((t) => t.profitLoss);
  const bestTrade = Math.max(...pnlValues);
  const worstTrade = Math.min(...pnlValues);

  const totalAmount = trades.reduce((sum, t) => sum + t.amount, 0);

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakevenTrades: breakevenTrades.length,
    grossProfit,
    grossLoss,
    netPnl,
    winRate,
    averageWin,
    averageLoss,
    bestTrade,
    worstTrade,
    totalAmount,
    profitFactor,
    expectancy,
  };
}

export function calculateStockStats(trades: TradeRecord[]): StockStats[] {
  const stockMap = new Map<string, TradeRecord[]>();

  for (const trade of trades) {
    const existing = stockMap.get(trade.stockName) || [];
    stockMap.set(trade.stockName, [...existing, trade]);
  }

  const stats: StockStats[] = [];

  for (const [stockName, stockTrades] of stockMap) {
    const wins = stockTrades.filter((t) => t.profitLoss > 0).length;
    const losses = stockTrades.filter((t) => t.profitLoss < 0).length;
    const breakeven = stockTrades.filter((t) => t.profitLoss === 0).length;
    const decisive = wins + losses;
    const netPnl = stockTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalAmount = stockTrades.reduce((sum, t) => sum + t.amount, 0);

    stats.push({
      stockName,
      trades: stockTrades.length,
      wins,
      losses,
      breakeven,
      winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
      netPnl,
      averagePnl: netPnl / stockTrades.length,
      totalAmount,
    });
  }

  return stats.sort((a, b) => b.netPnl - a.netPnl);
}

export function calculateBuySellStats(trades: TradeRecord[]): BuySellStats {
  const buyTrades = trades.filter((t) => t.tradeType === "BUY");
  const sellTrades = trades.filter((t) => t.tradeType === "SELL");

  const calcSide = (sideTrades: TradeRecord[]) => {
    const wins = sideTrades.filter((t) => t.profitLoss > 0).length;
    const losses = sideTrades.filter((t) => t.profitLoss < 0).length;
    const breakeven = sideTrades.filter((t) => t.profitLoss === 0).length;
    const decisive = wins + losses;
    const netPnl = sideTrades.reduce((sum, t) => sum + t.profitLoss, 0);

    return {
      trades: sideTrades.length,
      wins,
      losses,
      breakeven,
      winRate: decisive > 0 ? (wins / decisive) * 100 : 0,
      netPnl,
      averagePnl: sideTrades.length > 0 ? netPnl / sideTrades.length : 0,
    };
  };

  return {
    buy: calcSide(buyTrades),
    sell: calcSide(sellTrades),
  };
}

export function calculateTargetProgress(
  targetAmount: number,
  achieved: number
): TargetProgress {
  const pending = Math.max(targetAmount - achieved, 0);
  const excess = Math.max(achieved - targetAmount, 0);
  const progressPercent =
    targetAmount > 0 ? (achieved / targetAmount) * 100 : 0;
  const isExceeded = achieved >= targetAmount;

  return {
    targetAmount,
    achieved,
    pending,
    excess,
    progressPercent,
    isExceeded,
  };
}

export function calculateDailyBreakdown(
  tradingDays: TradingDayRecord[]
): DailyBreakdown[] {
  return tradingDays.map((day) => {
    const stats = calculateDailyStats(day.trades);
    return {
      date: day.tradingDate.toISOString().split("T")[0],
      trades: day.trades.length,
      netPnl: stats.netPnl,
      wins: stats.winningTrades,
      losses: stats.losingTrades,
    };
  });
}

export function formatCurrency(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getPnlColor(value: number): string {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-red-500";
  return "text-slate-400";
}

export function getPnlSign(value: number): string {
  if (value > 0) return "+";
  return "";
}
