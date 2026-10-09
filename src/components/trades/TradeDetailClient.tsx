"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TradeRecord } from "@/lib/calculations/analytics";
import { toast } from "sonner";
import { formatCurrency, getPnlColor, getPnlSign } from "@/lib/calculations/analytics";
import { Pencil, Trash2, Plus, Loader2, Check, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeDetailClientProps {
  trades: TradeRecord[];
  tradingDayId: string;
  dateStr: string;
}

interface EditingTrade {
  stockName: string;
  tradeType: "BUY" | "SELL";
  buyPoint: string;
  sellPoint: string;
  profitLoss: string;
  amount: string;
}

export function TradeDetailClient({ trades: initialTrades, tradingDayId, dateStr }: TradeDetailClientProps) {
  const router = useRouter();
  const [trades, setTrades] = useState(initialTrades);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingTrade>({
    stockName: "",
    tradeType: "BUY",
    buyPoint: "",
    sellPoint: "",
    profitLoss: "",
    amount: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (trade: TradeRecord) => {
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

      if (!res.ok) {
        toast.error("Failed to update trade.");
        return;
      }

      const updated = await res.json();
      setTrades((prev) => prev.map((t) => (t.id === tradeId ? updated : t)));
      setEditingId(null);
      toast.success("Trade updated!");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTrade = async (tradeId: string) => {
    setDeletingId(tradeId);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete trade.");
        return;
      }
      setTrades((prev) => prev.filter((t) => t.id !== tradeId));
      setDeleteConfirmId(null);
      toast.success("Trade deleted.");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Trades</h2>
        <span className="text-xs text-muted-foreground">{trades.length} total</span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="px-4 py-3 text-right">Buy</th>
              <th className="px-4 py-3 text-right">Sell</th>
              <th className="px-4 py-3 text-right">P/L</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-muted/20 transition-colors">
                {editingId === trade.id ? (
                  // Edit row
                  <>
                    <td className="px-4 py-2 text-sm text-muted-foreground">#{trade.tradeNumber}</td>
                    <td className="px-4 py-2">
                      <input
                        value={editForm.stockName}
                        onChange={(e) => setEditForm({ ...editForm, stockName: e.target.value.toUpperCase() })}
                        className="w-24 px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.tradeType}
                        onChange={(e) => setEditForm({ ...editForm, tradeType: e.target.value as "BUY" | "SELL" })}
                        className="px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editForm.buyPoint}
                        onChange={(e) => setEditForm({ ...editForm, buyPoint: e.target.value })}
                        type="number"
                        className="w-20 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editForm.sellPoint}
                        onChange={(e) => setEditForm({ ...editForm, sellPoint: e.target.value })}
                        type="number"
                        className="w-20 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="—"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editForm.profitLoss}
                        onChange={(e) => setEditForm({ ...editForm, profitLoss: e.target.value })}
                        type="number"
                        className="w-24 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        type="number"
                        className="w-24 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => saveEdit(trade.id)}
                          disabled={isSaving}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View row
                  <>
                    <td className="px-4 py-3 text-sm text-muted-foreground">#{trade.tradeNumber}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{trade.stockName}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          trade.tradeType === "BUY"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-purple-500/10 text-purple-500"
                        )}
                      >
                        {trade.tradeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {trade.buyPoint ? trade.buyPoint.toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {trade.sellPoint ? trade.sellPoint.toLocaleString("en-IN") : "—"}
                    </td>
                    <td className={cn("px-4 py-3 text-sm text-right font-bold", getPnlColor(trade.profitLoss))}>
                      {getPnlSign(trade.profitLoss)}{formatCurrency(Math.abs(trade.profitLoss))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-foreground">
                      {formatCurrency(trade.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {deleteConfirmId === trade.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => deleteTrade(trade.id)}
                            disabled={deletingId === trade.id}
                            className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                          >
                            {deletingId === trade.id ? "..." : "Delete"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEdit(trade)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Edit trade"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(trade.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500"
                            title="Delete trade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {trades.map((trade) => (
          <div key={trade.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{trade.tradeNumber}</span>
                <span className="font-semibold text-foreground">{trade.stockName}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    trade.tradeType === "BUY"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-purple-500/10 text-purple-500"
                  )}
                >
                  {trade.tradeType}
                </span>
              </div>
              <span className={cn("font-bold text-sm", getPnlColor(trade.profitLoss))}>
                {getPnlSign(trade.profitLoss)}{formatCurrency(Math.abs(trade.profitLoss))}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Buy: {trade.buyPoint || "—"} · Sell: {trade.sellPoint || "—"}</span>
              <span>Amount: {formatCurrency(trade.amount)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(trade)}
                className="flex-1 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => setDeleteConfirmId(trade.id)}
                className="flex-1 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
            {deleteConfirmId === trade.id && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-center">
                <p className="text-foreground mb-2">Delete this trade permanently?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteTrade(trade.id)}
                    className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-1.5 bg-muted rounded-lg transition-colors text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {trades.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No trades recorded for this day.</p>
        </div>
      )}
    </div>
  );
}
