"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TradeRecord,
  calculateDailyStats,
  formatCurrency,
  getPnlColor,
  getPnlSign,
} from "@/lib/calculations/analytics";
import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowUpRight, ArrowDownRight, Minus, ChevronRight, ChevronDown,
  Pencil, Trash2, Loader2, Check, X, Coffee, CalendarOff, Plus, TrendingUp, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────
type DayType = "TRADE" | "NO_TRADE" | "HOLIDAY";

interface Trade {
  id: string;
  tradeNumber: number;
  stockName: string;
  tradeType: "BUY" | "SELL";
  buyPoint: number | null;
  sellPoint: number | null;
  profitLoss: number;
  amount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  tradingDayId: string;
}

interface TradingDay {
  id: string;
  tradingDate: string | Date;
  dayType?: DayType;
  trades: Trade[];
}

interface EditingTrade {
  stockName: string;
  tradeType: "BUY" | "SELL";
  buyPoint: string;
  sellPoint: string;
  profitLoss: string;
  amount: string;
}

interface TradeHistoryClientProps {
  initialDays: TradingDay[];
  total: number;
  page: number;
  limit: number;
}

export function TradeHistoryClient({ initialDays, total, page, limit }: TradeHistoryClientProps) {
  const router = useRouter();
  const [days, setDays] = useState(initialDays);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingTrade>({
    stockName: "", tradeType: "BUY", buyPoint: "", sellPoint: "", profitLoss: "", amount: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTradeConfirm, setDeleteTradeConfirm] = useState<string | null>(null);
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const [deleteDayConfirm, setDeleteDayConfirm] = useState<string | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);
  const [addingToDayId, setAddingToDayId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<EditingTrade>({
    stockName: "", tradeType: "BUY", buyPoint: "", sellPoint: "", profitLoss: "", amount: "",
  });

  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  // ── Toggle expand ──────────────────────────────────────────────────────────
  const toggleExpand = (dateStr: string) => {
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr));
    setEditingId(null);
    setDeleteTradeConfirm(null);
  };

  // ── Edit trade ─────────────────────────────────────────────────────────────
  const startEdit = (trade: Trade) => {
    setEditingId(trade.id);
    setEditForm({
      stockName: trade.stockName,
      tradeType: trade.tradeType,
      buyPoint: trade.buyPoint?.toString() || "",
      sellPoint: trade.sellPoint?.toString() || "",
      profitLoss: trade.profitLoss.toString(),
      amount: trade.amount.toString(),
    });
  };

  const saveEdit = async (tradeId: string) => {
    if (!editForm.stockName || !editForm.profitLoss || !editForm.amount) {
      toast.error("Stock name, P/L, and amount are required.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockName: editForm.stockName.toUpperCase(),
          tradeType: editForm.tradeType,
          buyPoint: editForm.buyPoint ? parseFloat(editForm.buyPoint) : null,
          sellPoint: editForm.sellPoint ? parseFloat(editForm.sellPoint) : null,
          profitLoss: parseFloat(editForm.profitLoss),
          amount: parseFloat(editForm.amount),
        }),
      });
      if (!res.ok) { toast.error("Failed to update trade."); return; }
      const updated = await res.json();
      setDays((prev) =>
        prev.map((d) => ({
          ...d,
          trades: d.trades.map((t) => (t.id === tradeId ? { ...t, ...updated } : t)),
        }))
      );
      setEditingId(null);
      toast.success("Trade updated!");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete trade ───────────────────────────────────────────────────────────
  const deleteTrade = async (tradeId: string) => {
    setDeletingTradeId(tradeId);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete trade."); return; }
      setDays((prev) =>
        prev.map((d) => ({
          ...d,
          trades: d.trades.filter((t) => t.id !== tradeId),
        }))
      );
      setDeleteTradeConfirm(null);
      toast.success("Trade deleted.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setDeletingTradeId(null);
    }
  };

  // ── Delete entire day ──────────────────────────────────────────────────────
  const deleteDay = async (dayId: string, tradingDate: string | Date) => {
    const dateStr = typeof tradingDate === "string"
      ? tradingDate.split("T")[0]
      : format(tradingDate, "yyyy-MM-dd");
    setDeletingDayId(dayId);
    try {
      const res = await fetch(`/api/trading-days/${dateStr}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete trading day."); return; }
      setDays((prev) => prev.filter((d) => d.id !== dayId));
      setDeleteDayConfirm(null);
      toast.success("Trading day deleted.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setDeletingDayId(null);
    }
  };

  // ── Add trade to existing day ──────────────────────────────────────────────
  const startAddTrade = (dayId: string) => {
    setAddingToDayId(dayId);
    setAddForm({ stockName: "", tradeType: "BUY", buyPoint: "", sellPoint: "", profitLoss: "", amount: "" });
    setEditingId(null);
  };

  const saveNewTrade = async (dayId: string) => {
    if (!addForm.stockName || !addForm.profitLoss || !addForm.amount) {
      toast.error("Stock name, P/L, and amount are required.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradingDayId: dayId,
          stockName: addForm.stockName.toUpperCase(),
          tradeType: addForm.tradeType,
          buyPoint: addForm.buyPoint ? parseFloat(addForm.buyPoint) : null,
          sellPoint: addForm.sellPoint ? parseFloat(addForm.sellPoint) : null,
          profitLoss: parseFloat(addForm.profitLoss),
          amount: parseFloat(addForm.amount),
        }),
      });
      if (!res.ok) { toast.error("Failed to add trade."); return; }
      const newTrade = await res.json();
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId ? { ...d, trades: [...d.trades, newTrade] } : d
        )
      );
      setAddingToDayId(null);
      toast.success("Trade added!");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="hidden sm:grid grid-cols-7 gap-4 px-6 py-3 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
        <span className="col-span-2">Date</span>
        <span className="text-center">Type</span>
        <span className="text-center">Trades</span>
        <span className="text-right">Net P/L</span>
        <span className="text-center">Win Rate</span>
        <span className="text-center">Actions</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {days.map((day) => {
          const dayType = (day.dayType ?? "TRADE") as DayType;
          const isNoTrade = dayType === "NO_TRADE";
          const isHoliday = dayType === "HOLIDAY";
          const isSpecial = isNoTrade || isHoliday;
          const dateStr =
            typeof day.tradingDate === "string"
              ? day.tradingDate.split("T")[0]
              : format(day.tradingDate, "yyyy-MM-dd");
          const displayDate =
            typeof day.tradingDate === "string"
              ? format(new Date(day.tradingDate), "dd MMM yyyy")
              : format(day.tradingDate, "dd MMM yyyy");
          const stats = isSpecial ? null : calculateDailyStats(day.trades as TradeRecord[]);
          const isExpanded = expandedDate === dateStr;

          const Icon = isHoliday
            ? CalendarOff
            : isNoTrade
            ? Coffee
            : stats && stats.netPnl > 0
            ? ArrowUpRight
            : stats && stats.netPnl < 0
            ? ArrowDownRight
            : Minus;

          const iconColor = isHoliday
            ? "text-emerald-500"
            : isNoTrade
            ? "text-amber-500"
            : stats && stats.netPnl > 0
            ? "text-emerald-500"
            : stats && stats.netPnl < 0
            ? "text-red-500"
            : "text-slate-400";

          const iconBg = isHoliday
            ? "bg-emerald-500/10"
            : isNoTrade
            ? "bg-amber-500/10"
            : stats && stats.netPnl > 0
            ? "bg-emerald-500/10"
            : stats && stats.netPnl < 0
            ? "bg-red-500/10"
            : "bg-slate-500/10";

          return (
            <div key={day.id}>
              {/* Summary row */}
              <div
                className={cn(
                  "flex sm:grid sm:grid-cols-7 sm:gap-4 items-center px-4 sm:px-6 py-4 transition-colors cursor-pointer group",
                  isExpanded ? "bg-muted/40" : "hover:bg-muted/20",
                  isSpecial && "bg-muted/10"
                )}
                onClick={() => !isSpecial && toggleExpand(dateStr)}
              >
                {/* Date */}
                <div className="col-span-2 flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
                    <Icon className={cn("w-4 h-4", iconColor)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{displayDate}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {isSpecial
                        ? isHoliday ? "Holiday" : "No Trade"
                        : `${stats?.totalTrades ?? 0} trades`}
                    </p>
                  </div>
                </div>

                {/* Type badge */}
                <div className="hidden sm:flex justify-center">
                  {isHoliday ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">🏖️ Holiday</span>
                  ) : isNoTrade ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400">☕ No Trade</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500">Trade</span>
                  )}
                </div>

                {/* Trade count */}
                <span className="hidden sm:block text-center text-sm text-foreground">
                  {isSpecial ? "—" : stats?.totalTrades ?? 0}
                </span>

                {/* Net P/L */}
                <span className={cn("ml-auto sm:ml-0 text-right text-sm font-bold", isSpecial ? "text-muted-foreground" : getPnlColor(stats?.netPnl ?? 0))}>
                  {isSpecial ? "—" : `${getPnlSign(stats!.netPnl)}${formatCurrency(Math.abs(stats!.netPnl))}`}
                </span>

                {/* Win Rate */}
                <div className="hidden sm:flex items-center justify-center">
                  {isSpecial ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    <span className={cn("text-sm", (stats?.winRate ?? 0) >= 50 ? "text-emerald-500" : "text-red-500")}>
                      {stats?.winRate.toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="hidden sm:flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {!isSpecial && (
                    <button
                      onClick={() => toggleExpand(dateStr)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title={isExpanded ? "Collapse" : "Expand trades"}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                  {deleteDayConfirm === day.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteDay(day.id, day.tradingDate)}
                        disabled={deletingDayId === day.id}
                        className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        {deletingDayId === day.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                      </button>
                      <button
                        onClick={() => setDeleteDayConfirm(null)}
                        className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteDayConfirm(day.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                      title="Delete entire day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded trades */}
              {isExpanded && !isSpecial && (
                <div className="border-t border-border bg-muted/10 animate-fade-in">
                  {/* Mobile delete-day button */}
                  <div className="sm:hidden px-4 py-2 border-b border-border">
                    {deleteDayConfirm === day.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500 flex-1">Delete entire day?</span>
                        <button onClick={() => deleteDay(day.id, day.tradingDate)} disabled={deletingDayId === day.id}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded">{deletingDayId === day.id ? "..." : "Delete"}</button>
                        <button onClick={() => setDeleteDayConfirm(null)} className="px-3 py-1 text-xs bg-muted rounded">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteDayConfirm(day.id)}
                        className="w-full py-1.5 text-xs bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete Entire Day
                      </button>
                    )}
                  </div>

                  {day.trades.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No trades on this day.</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {day.trades.map((trade) => (
                        <div key={trade.id} className="px-4 sm:px-8 py-3">
                          {editingId === trade.id ? (
                            /* ── Edit form ── */
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-muted-foreground">Stock Name</label>
                                  <input value={editForm.stockName}
                                    onChange={(e) => setEditForm({ ...editForm, stockName: e.target.value.toUpperCase() })}
                                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Type</label>
                                  <select value={editForm.tradeType}
                                    onChange={(e) => setEditForm({ ...editForm, tradeType: e.target.value as "BUY" | "SELL" })}
                                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                    <option value="BUY">BUY</option>
                                    <option value="SELL">SELL</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">P/L (₹)</label>
                                  <input value={editForm.profitLoss} type="number"
                                    onChange={(e) => setEditForm({ ...editForm, profitLoss: e.target.value })}
                                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Buy Point</label>
                                  <input value={editForm.buyPoint} type="number"
                                    onChange={(e) => setEditForm({ ...editForm, buyPoint: e.target.value })}
                                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="—" />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Sell Point</label>
                                  <input value={editForm.sellPoint} type="number"
                                    onChange={(e) => setEditForm({ ...editForm, sellPoint: e.target.value })}
                                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="—" />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Amount (₹)</label>
                                  <input value={editForm.amount} type="number"
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(trade.id)} disabled={isSaving}
                                  className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1 transition-colors">
                                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                                </button>
                                <button onClick={() => setEditingId(null)}
                                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg flex items-center gap-1 transition-colors">
                                  <X className="w-3 h-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── View row ── */
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                                  trade.profitLoss > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                                  trade.profitLoss < 0 ? "bg-red-500/15 text-red-600 dark:text-red-400" :
                                  "bg-slate-500/10 text-slate-400"
                                )}>
                                  #{trade.tradeNumber}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{trade.stockName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={cn(
                                      "px-1.5 py-0.5 rounded text-xs font-medium",
                                      trade.tradeType === "BUY" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                                    )}>{trade.tradeType}</span>
                                    {trade.buyPoint && <span className="text-xs text-muted-foreground">Buy: {trade.buyPoint}</span>}
                                    {trade.sellPoint && <span className="text-xs text-muted-foreground">Sell: {trade.sellPoint}</span>}
                                    <span className="text-xs text-muted-foreground">Amt: {formatCurrency(trade.amount)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={cn("text-sm font-bold", getPnlColor(trade.profitLoss))}>
                                  {getPnlSign(trade.profitLoss)}{formatCurrency(Math.abs(trade.profitLoss))}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button onClick={() => startEdit(trade)}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  {deleteTradeConfirm === trade.id ? (
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => deleteTrade(trade.id)} disabled={deletingTradeId === trade.id}
                                        className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                                        {deletingTradeId === trade.id ? "..." : "Yes"}
                                      </button>
                                      <button onClick={() => setDeleteTradeConfirm(null)}
                                        className="px-2 py-1 text-xs bg-muted rounded transition-colors">No</button>
                                    </div>
                                  ) : (
                                    <button onClick={() => setDeleteTradeConfirm(trade.id)}
                                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500" title="Delete">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add trade to this day */}
                  <div className="px-4 sm:px-8 py-3 border-t border-border/50">
                    {addingToDayId === day.id ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-foreground">New trade</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Stock Name</label>
                            <input value={addForm.stockName}
                              onChange={(e) => setAddForm({ ...addForm, stockName: e.target.value.toUpperCase() })}
                              className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="e.g. RELIANCE" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Type</label>
                            <select value={addForm.tradeType}
                              onChange={(e) => setAddForm({ ...addForm, tradeType: e.target.value as "BUY" | "SELL" })}
                              className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                              <option value="BUY">BUY</option>
                              <option value="SELL">SELL</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Amount Traded (₹)</label>
                            <input value={addForm.amount} type="number"
                              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                              className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Buy Point</label>
                            <input value={addForm.buyPoint} type="number"
                              onChange={(e) => setAddForm({ ...addForm, buyPoint: e.target.value })}
                              className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="—" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Sell Point</label>
                            <input value={addForm.sellPoint} type="number"
                              onChange={(e) => setAddForm({ ...addForm, sellPoint: e.target.value })}
                              className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="—" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Profit / Loss (₹)</label>
                            <div className="flex gap-1 mt-1">
                              {(["PROFIT", "LOSS"] as const).map((dir) => {
                                const isLoss = addForm.profitLoss.startsWith("-");
                                const active = dir === "LOSS" ? isLoss : !isLoss;
                                const abs = addForm.profitLoss.replace("-", "");
                                return (
                                  <button key={dir} type="button"
                                    onClick={() => setAddForm({ ...addForm, profitLoss: dir === "LOSS" && abs ? `-${abs}` : abs })}
                                    className={cn(
                                      "px-2 rounded border text-xs font-bold flex items-center",
                                      active
                                        ? dir === "PROFIT" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-red-500 bg-red-500/10 text-red-500"
                                        : "border-border text-muted-foreground"
                                    )}>
                                    {dir === "PROFIT" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  </button>
                                );
                              })}
                              <input
                                value={addForm.profitLoss.replace("-", "")}
                                type="number" min="0"
                                onChange={(e) => {
                                  const wasLoss = addForm.profitLoss.startsWith("-");
                                  const v = e.target.value;
                                  setAddForm({ ...addForm, profitLoss: wasLoss && v ? `-${v}` : v });
                                }}
                                className="w-full px-2 py-1.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveNewTrade(day.id)} disabled={isSaving}
                            className="px-3 py-1.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1 transition-colors">
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save Trade
                          </button>
                          <button onClick={() => setAddingToDayId(null)}
                            className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg flex items-center gap-1 transition-colors">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => startAddTrade(day.id)}
                        className="w-full py-2 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center justify-center gap-1 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Trade to this day
                      </button>
                    )}
                  </div>

                  {/* Link to full detail page */}
                  <div className="px-4 sm:px-8 py-2 border-t border-border/50 text-center">
                    <Link href={`/trades/${dateStr}`} className="text-xs text-primary hover:underline font-medium">
                      View Full Details →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {skip + 1}–{Math.min(skip + limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/trades?page=${page - 1}`}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors">Previous</Link>
            )}
            {page < totalPages && (
              <Link href={`/trades?page=${page + 1}`}
                className="px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors">Next</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
