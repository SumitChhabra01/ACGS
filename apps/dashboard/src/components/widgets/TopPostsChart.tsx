"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TopPostsChart({
  data,
}: {
  data: { label: string; engagement: number; reach: number }[];
}) {
  if (!data?.length) {
    return <p className="text-sm text-ink-dim">No chart data.</p>;
  }

  return (
    <div className="h-72 min-h-[12rem] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="label"
            stroke="#525b7a"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-12}
            textAnchor="end"
            height={50}
          />
          <YAxis
            stroke="#525b7a"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "rgba(10,14,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) =>
              name === "engagement" ? [`${value}%`, "Engagement"] : [value, name]
            }
          />
          <Bar dataKey="engagement" fill="#33ffb2" radius={[4, 4, 0, 0]} name="engagement" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
