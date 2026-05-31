"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function EngagementChart({
  data,
}: {
  data: { day: string; instagram: number; youtube: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" stroke="#525b7a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#525b7a" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "rgba(10,14,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="instagram" fill="#ff4ecd" radius={[4, 4, 0, 0]} name="Instagram" />
          <Bar dataKey="youtube" fill="#ff5470" radius={[4, 4, 0, 0]} name="YouTube" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
