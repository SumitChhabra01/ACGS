"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function BurnChart({
  data,
}: {
  data: { day: string; mid: number; premium: number }[];
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="midGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34e7ff" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#34e7ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="#525b7a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#525b7a" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(10,14,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "#8a93b2" }}
          />
          <Area type="monotone" dataKey="mid" stroke="#34e7ff" fill="url(#midGrad)" strokeWidth={2} name="Mid (Haiku)" />
          <Area type="monotone" dataKey="premium" stroke="#a855f7" fill="url(#premGrad)" strokeWidth={2} name="Premium (Sonnet)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
