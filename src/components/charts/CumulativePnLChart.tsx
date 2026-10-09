"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CumulativePnLChartProps {
  data: { date: string; cumPnl: number }[];
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        <p className={value >= 0 ? "text-emerald-500" : "text-red-500"}>
          Cumulative P/L:{" "}
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(value)}
        </p>
      </div>
    );
  }
  return null;
};

export function CumulativePnLChart({ data }: CumulativePnLChartProps) {
  const isPositive = data.length === 0 || data[data.length - 1].cumPnl >= 0;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? "#10b981" : "#ef4444"}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? "#10b981" : "#ef4444"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
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
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="cumPnl"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth={2.5}
          fill="url(#pnlGradient)"
          dot={false}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
