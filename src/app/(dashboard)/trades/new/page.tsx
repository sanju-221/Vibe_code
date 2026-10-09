"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Loader2, TrendingUp, TrendingDown, BarChart2, Coffee, CalendarOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DatePickerPopover } from "@/components/ui/DatePickerPopover";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PlDirection = "PROFIT" | "LOSS";
type DayType     = "TRADE" | "NO_TRADE" | "HOLIDAY";

interface TradeState {
  stockName:   string;
  tradeType:   "BUY" | "SELL";
  buyPoint:    string;
  sellPoint:   string;
  plDirection: PlDirection;
  plAmount:    string;
  amount:      string;
}

const emptyTrade = (): TradeState => ({
  stockName: "", tradeType: "BUY",
  buyPoint: "", sellPoint: "",
  plDirection: "PROFIT", plAmount: "", amount: "",
});

// ─── Component ─────────────────────────────────────────────────────────────────
export default function NewTradePage() {
  const router = useRouter();

  // Step: 1 = date, 1.5 = day-type, 2 = trade forms
  const [step, setStep]               = useState<1 | 1.5 | 2>(1);
  const [dateInput, setDateInput]     = useState("");
  const [dayType, setDayType]         = useState<DayType | null>(null);
  const [numTradesInput, setNum]      = useState("1");
  const [stepError, setStepError]     = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [trades, setTrades]           = useState<TradeState[]>([emptyTrade()]);
  const [errors, setErrors]           = useState<{ [k: string]: string }[]>([{}]);

  // ── Step 1 → 1.5 ──────────────────────────────────────────────────────────
  const handleDateContinue = () => {
    setStepError("");
    if (!dateInput) { setStepError("Please select a date."); return; }
    setDayType(null);
    setStep(1.5);
  };

  // ── Step 1.5: select day type ──────────────────────────────────────────────
  const handleDayType = async (type: DayType) => {
    setDayType(type);
    if (type === "NO_TRADE" || type === "HOLIDAY") {
      // Save immediately — no trades needed
      setSubmitting(true);
      try {
        const res = await fetch("/api/trading-days", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tradingDate: dateInput, dayType: type }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Failed to save."); return; }
        toast.success(type === "HOLIDAY" ? "🏖️ Holiday marked!" : "✅ No-trade day recorded!");
        router.push("/trades");
        router.refresh();
      } catch {
        toast.error("Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    } else {
      // TRADE → go to count step
      setStep(2);
      setTrades([emptyTrade()]);
      setErrors([{}]);
    }
  };

  // ── Step 1.5 → 2 (trade count confirm) ────────────────────────────────────
  const handleTradeCount = () => {
    setStepError("");
    const n = parseInt(numTradesInput);
    if (!n || n < 1 || n > 100 || !Number.isInteger(n)) {
      setStepError("Number of trades must be 1–100."); return;
    }
    setTrades(Array.from({ length: n }, emptyTrade));
    setErrors(Array.from({ length: n }, () => ({})));
  };

  // ── Field updaters ─────────────────────────────────────────────────────────
  const updateTrade = (index: number, field: keyof TradeState, value: string) => {
    setTrades((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next; });
    setErrors((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: "" }; return next; });
  };
  const toggleDirection = (index: number) => {
    setTrades((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], plDirection: next[index].plDirection === "PROFIT" ? "LOSS" : "PROFIT" };
      return next;
    });
  };

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = trades.map((t) => {
      const e: { [k: string]: string } = {};
      if (!t.stockName.trim()) e.stockName = "Stock name is required";
      if (!t.plAmount || isNaN(parseFloat(t.plAmount)) || parseFloat(t.plAmount) < 0)
        e.plAmount = "Enter a valid amount (₹)";
      if (!t.amount || isNaN(parseFloat(t.amount)) || parseFloat(t.amount) <= 0)
        e.amount = "Enter traded amount (₹)";
      return e;
    });
    setErrors(newErrors);
    return newErrors.every((e) => Object.keys(e).length === 0);
  };

  // ── Submit trades ──────────────────────────────────────────────────────────
  const onSubmit = async () => {
    if (!validate()) { toast.error("Please fix the errors before saving."); return; }
    setSubmitting(true);
    try {
      const cleanTrades = trades.map((t, i) => ({
        tradeNumber: i + 1,
        stockName: t.stockName.trim().toUpperCase(),
        tradeType: t.tradeType,
        buyPoint:  t.buyPoint  !== "" ? parseFloat(t.buyPoint)  : null,
        sellPoint: t.sellPoint !== "" ? parseFloat(t.sellPoint) : null,
        profitLoss: t.plDirection === "LOSS" ? -Math.abs(parseFloat(t.plAmount)) : Math.abs(parseFloat(t.plAmount)),
        amount: parseFloat(t.amount),
      }));

      const res = await fetch("/api/trading-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradingDate: dateInput, dayType: "TRADE", trades: cleanTrades }),
      });

      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed to save."); return; }
      toast.success("Trading day saved successfully!");
      router.push("/trades");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const stepLabels = ["Select Date", "Day Type", "Trade Details"];
  const stepIdx = step === 1 ? 0 : step === 1.5 ? 1 : 2;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Trading Day</h1>
        <p className="text-muted-foreground text-sm mt-1">Record what happened on a trading day</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
              i <= stepIdx ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}>{i + 1}</div>
            <span className={cn("text-xs hidden sm:block", i === stepIdx ? "text-foreground font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {i < 2 && <div className={cn("flex-1 h-0.5 transition-colors", i < stepIdx ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Select Date ── */}
      {step === 1 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h2 className="font-semibold text-foreground">Select Date</h2>
          {stepError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{stepError}</div>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Date <span className="text-red-500">*</span>
            </label>
            <DatePickerPopover
              value={dateInput}
              onChange={setDateInput}
              placeholder="Select date"
              maxDate={new Date()}
            />
          </div>
          <button
            onClick={handleDateContinue}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 1.5: Day Type ── */}
      {step === 1.5 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">What happened on this day?</h2>
            <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline">
              ← Change date
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            {format(new Date(dateInput + "T00:00:00"), "EEEE, dd MMMM yyyy")}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {/* TRADE */}
            <button
              onClick={() => handleDayType("TRADE")}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <BarChart2 className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">Trade</p>
                <p className="text-xs text-muted-foreground mt-0.5">I took trades</p>
              </div>
            </button>

            {/* NO TRADE */}
            <button
              onClick={() => handleDayType("NO_TRADE")}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border bg-background hover:border-amber-500 hover:bg-amber-500/5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Coffee className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">No Trade</p>
                <p className="text-xs text-muted-foreground mt-0.5">Skipped today</p>
              </div>
            </button>

            {/* HOLIDAY */}
            <button
              onClick={() => handleDayType("HOLIDAY")}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border bg-background hover:border-emerald-500 hover:bg-emerald-500/5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <CalendarOff className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">Holiday</p>
                <p className="text-xs text-muted-foreground mt-0.5">Market closed</p>
              </div>
            </button>
          </div>

          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Trade Count + Trade Forms ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Date info bar */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {format(new Date(dateInput + "T00:00:00"), "dd MMMM yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">Trading Day</p>
              </div>
            </div>
            <button onClick={() => setStep(1.5)} className="text-xs text-primary hover:underline">
              Change
            </button>
          </div>

          {/* Trade count selector */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">How many trades?</h2>
            {stepError && (
              <div className="p-3 mb-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{stepError}</div>
            )}
            <div className="flex gap-3">
              <input
                type="number"
                value={numTradesInput}
                onChange={(e) => setNum(e.target.value)}
                min={1} max={100}
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Number of trades (1–100)"
              />
              <button
                onClick={handleTradeCount}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
              >
                Set <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trade cards */}
          {trades.map((trade, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Trade {index + 1}</h3>
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">#{index + 1}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stock Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Stock Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={trade.stockName}
                    onChange={(e) => updateTrade(index, "stockName", e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground uppercase placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    placeholder="e.g. RELIANCE"
                  />
                  {errors[index]?.stockName && <p className="text-red-400 text-xs">{errors[index].stockName}</p>}
                </div>

                {/* Trade Type */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(["BUY", "SELL"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateTrade(index, "tradeType", t)}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200",
                          trade.tradeType === t
                            ? t === "BUY"
                              ? "border-blue-500 bg-blue-500/10 text-blue-500"
                              : "border-purple-500 bg-purple-500/10 text-purple-500"
                            : "border-border text-muted-foreground hover:border-border/60"
                        )}
                      >{t}</button>
                    ))}
                  </div>
                </div>

                {/* Buy Point */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Buy Point <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <input
                    value={trade.buyPoint}
                    onChange={(e) => updateTrade(index, "buyPoint", e.target.value)}
                    type="number" step="0.01"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    placeholder="0.00"
                  />
                </div>

                {/* Sell Point */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Sell Point <span className="text-muted-foreground text-xs">(optional)</span>
                  </label>
                  <input
                    value={trade.sellPoint}
                    onChange={(e) => updateTrade(index, "sellPoint", e.target.value)}
                    type="number" step="0.01"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    placeholder="0.00"
                  />
                </div>

                {/* Profit / Loss */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground">
                    Profit / Loss <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3 items-stretch">
                    <button
                      type="button"
                      onClick={() => toggleDirection(index)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all duration-300 min-w-[120px] justify-center select-none",
                        trade.plDirection === "PROFIT"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20 shadow-md"
                          : "border-red-500 bg-red-500/10 text-red-500 shadow-red-500/20 shadow-md"
                      )}
                    >
                      {trade.plDirection === "PROFIT"
                        ? <><TrendingUp className="w-4 h-4" /> PROFIT</>
                        : <><TrendingDown className="w-4 h-4" /> LOSS</>}
                    </button>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm select-none">₹</span>
                      <input
                        value={trade.plAmount}
                        onChange={(e) => updateTrade(index, "plAmount", e.target.value)}
                        type="number" step="0.01" min="0"
                        className={cn(
                          "w-full pl-7 pr-3 py-2.5 bg-background border-2 rounded-xl text-foreground focus:outline-none transition-all text-sm font-semibold",
                          trade.plDirection === "PROFIT"
                            ? "border-emerald-500/40 focus:border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-red-500/40 focus:border-red-500 text-red-600 dark:text-red-400"
                        )}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {trade.plAmount && parseFloat(trade.plAmount) > 0 && (
                    <p className={cn("text-xs font-medium mt-1", trade.plDirection === "PROFIT" ? "text-emerald-500" : "text-red-500")}>
                      {trade.plDirection === "PROFIT" ? "+" : "-"}₹{parseFloat(trade.plAmount).toLocaleString("en-IN")} will be recorded
                    </p>
                  )}
                  {errors[index]?.plAmount && <p className="text-red-400 text-xs">{errors[index].plAmount}</p>}
                </div>

                {/* Amount Traded */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground">
                    Amount Traded (₹) <span className="text-red-500">*</span>
                    <span className="text-muted-foreground text-xs font-normal ml-1">— capital deployed</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm select-none">₹</span>
                    <input
                      value={trade.amount}
                      onChange={(e) => updateTrade(index, "amount", e.target.value)}
                      type="number" step="0.01" min="0.01"
                      className="w-full pl-7 pr-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                      placeholder="e.g. 10000"
                    />
                  </div>
                  {errors[index]?.amount && <p className="text-red-400 text-xs">{errors[index].amount}</p>}
                </div>
              </div>
            </div>
          ))}

          {/* Save button */}
          {trades.length > 0 && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : "Save Trading Day"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
