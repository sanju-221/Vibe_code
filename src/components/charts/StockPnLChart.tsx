"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StockPnLChartProps {
  data: { stockName: string; netPnl: number; trades: number }[];
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { trades: number } }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className={value >= 0 ? "text-emerald-500" : "text-red-500"}>
          Net P/L: {value >= 0 ? "+" : ""}
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(value)}
        </p>
        <p className="text-muted-foreground">Trades: {payload[0].payload.trades}</p>
      </div>
    );
  }
  return null;
};

export function StockPnLChart({ data }: StockPnLChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 200)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            new Intl.NumberFormat("en-IN", {
              notation: "compact",
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(v)
          }
        />
        <YAxis
          type="category"
          dataKey="stockName"
          tick={{ fontSize: 12, fontWeight: 500 }}
          className="text-foreground"
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
        <Bar dataKey="netPnl" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.netPnl >= 0 ? "#10b981" : "#ef4444"}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
