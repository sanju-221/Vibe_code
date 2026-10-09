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

interface DataPoint {
  date: string;
  pnl: number;
  trades?: number;
}

interface MonthlyPnLChartProps {
  data: DataPoint[];
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; payload: DataPoint }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className={value >= 0 ? "text-emerald-500" : "text-red-500"}>
          P/L: {value >= 0 ? "+" : ""}
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(value)}
        </p>
        {payload[0].payload.trades !== undefined && (
          <p className="text-muted-foreground">Trades: {payload[0].payload.trades}</p>
        )}
      </div>
    );
  }
  return null;
};

export function MonthlyPnLChart({ data }: MonthlyPnLChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
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
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
