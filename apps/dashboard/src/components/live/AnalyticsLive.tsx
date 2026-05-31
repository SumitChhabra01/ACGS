"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Panel, StatPill } from "@/components/ui/Panel";
import { TopPostsChart } from "@/components/widgets/TopPostsChart";
import { fetchLatestAnalytics } from "@/lib/live-client";
import type { GrowthReport } from "@/lib/growth";
import { formatCompact } from "@/lib/utils";

export function AnalyticsLive() {
  const [live, setLive] = useState<GrowthReport | null | undefined>(undefined);

  useEffect(() => {
    fetchLatestAnalytics().then(setLive);
  }, []);

  if (live === undefined) {
    return (
      <div>
        <TopBar title="Analytics" subtitle="Loading @cineai_diaries snapshot…" />
      </div>
    );
  }

  if (!live) {
    return (
      <div>
        <TopBar title="Analytics" subtitle="No snapshot yet" />
        <Panel title="Waiting for daily analytics cron">
          <p className="text-sm text-ink-dim">
            Run the <strong>Agents — Analytics</strong> workflow on GitHub. It saves your Instagram
            growth report to Supabase; refresh this page to view it (no site redeploy needed).
          </p>
        </Panel>
      </div>
    );
  }

  const erPct = `${(live.avgEngagementRate * 100).toFixed(1)}%`;
  const bestTime =
    live.bestHourUtc === null ? "—" : `${String(live.bestHourUtc).padStart(2, "0")}:00 UTC`;

  return (
    <div>
      <TopBar
        title="Analytics"
        subtitle={`Live @cineai_diaries — ${live.postsAnalyzed} posts (from daily analytics cron)`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatPill label="Followers" value={formatCompact(live.followers)} accent="pink" />
        <StatPill label="Posts" value={String(live.mediaCount)} accent="violet" />
        <StatPill label="Avg engagement" value={erPct} accent="green" />
        <StatPill label="Best day" value={live.bestWeekday ?? "—"} accent="cyan" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          title="Top posts by engagement"
          subtitle={`Best format: ${live.bestFormat ?? "—"} · Best time: ${bestTime}`}
          className="xl:col-span-2"
        >
          <TopPostsChart
            data={live.topPosts.map((p) => ({
              label: p.hook.slice(0, 24) || p.id.slice(-6),
              engagement: Math.round(p.engagementRate * 1000) / 10,
              reach: p.reach,
            }))}
          />
        </Panel>
        <Panel title="Growth recommendations" subtitle="From daily analytics cron">
          <ul className="space-y-3 text-sm text-ink-dim">
            {live.recommendations.map((r, i) => (
              <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Top posts" subtitle="Tap to open on Instagram">
          <ul className="divide-y divide-white/5">
            {live.topPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <a
                  href={p.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-ink hover:text-neon-cyan"
                >
                  {p.hook || p.id}
                </a>
                <span className="shrink-0 text-xs text-ink-dim">
                  <span className="text-neon-green">{(p.engagementRate * 100).toFixed(1)}%</span>{" "}
                  · {formatCompact(p.reach)} reach
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
