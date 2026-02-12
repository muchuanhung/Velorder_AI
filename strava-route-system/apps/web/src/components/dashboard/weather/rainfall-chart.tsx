"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type RainfallDataPoint = {
  hour: string;
  precipitation: number;
  label: string;
};

const defaultRainfallData: RainfallDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
  hour: i === 0 ? "Now" : `${i}h`,
  precipitation: 0,
  label: "—",
}));

interface RainfallChartProps {
  data?: RainfallDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const value = payload?.[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-sm font-bold text-[#60a5fa]">
        {value}% 降雨機率
      </p>
    </div>
  );
}

export function RainfallChart({ data = defaultRainfallData }: RainfallChartProps) {
  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#818cf8" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="oklch(0.25 0.005 250)"
          />
          <XAxis
            dataKey="hour"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "oklch(0.65 0 0)" }}
            interval={1}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "oklch(0.65 0 0)" }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="precipitation"
            stroke="#60a5fa"
            strokeWidth={2}
            fill="url(#rainGradient)"
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}