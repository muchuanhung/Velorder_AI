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

const rainfallData = [
  { hour: "Now", precipitation: 5, label: "12 PM" },
  { hour: "1h", precipitation: 12, label: "1 PM" },
  { hour: "2h", precipitation: 28, label: "2 PM" },
  { hour: "3h", precipitation: 45, label: "3 PM" },
  { hour: "4h", precipitation: 38, label: "4 PM" },
  { hour: "5h", precipitation: 22, label: "5 PM" },
  { hour: "6h", precipitation: 15, label: "6 PM" },
  { hour: "7h", precipitation: 8, label: "7 PM" },
  { hour: "8h", precipitation: 3, label: "8 PM" },
  { hour: "9h", precipitation: 10, label: "9 PM" },
  { hour: "10h", precipitation: 18, label: "10 PM" },
  { hour: "11h", precipitation: 25, label: "11 PM" },
];

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

  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-sm font-bold text-[#60a5fa]">
        {payload[0].value}% rain
      </p>
    </div>
  );
}

export function RainfallChart() {
  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rainfallData}
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