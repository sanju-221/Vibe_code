"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WinLossDonutProps {
  winning: number;
  losing: number;
  breakeven: number;
}

const COLORS = {
  winning: "#10b981",
  losing: "#ef4444",
  breakeven: "#6b7280",
};

interface DonutTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
  total: number;
}

// Defined at module level (not inside the component) so React doesn't
// recreate the component type on every render.
function DonutTooltip({ active, payload, total }: DonutTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-medium" style={{ color: item.payload.color }}>
          {item.name}
        </p>
        <p className="text-foreground">
          {item.value} trades ({((item.value / total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
}

export function WinLossDonut({ winning, losing, breakeven }: WinLossDonutProps) {
  const data = [
    { name: "Winning", value: winning, color: COLORS.winning },
    { name: "Losing", value: losing, color: COLORS.losing },
    ...(breakeven > 0 ? [{ name: "Breakeven", value: breakeven, color: COLORS.breakeven }] : []),
  ].filter((d) => d.value > 0);

  const total = winning + losing + breakeven;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<DonutTooltip total={total} />} />
        <Legend
          formatter={(value, entry) => (
            <span className="text-xs text-muted-foreground">
              {value} ({(entry.payload as unknown as { value?: number } | undefined)?.value})
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
