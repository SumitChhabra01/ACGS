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
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestAnalytics()
      .then((report) => {
        setFetchError(null);
        setLive(report);
      })
      .catch((err: unknown) => {
        console.error("Analytics fetch failed:", err);
        setFetchError(err instanceof Error ? err.message : "Could not load analytics");
        setLive(null);
      });
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
        <Panel title={fetchError ? "Could not load analytics" : "Waiting for daily analytics cron"}>
          <p className="text-sm text-ink-dim">
            {fetchError ? (
              <>
                {fetchError}. Check that GitHub secrets include{" "}
                <code className="text-neon-cyan">SUPABASE_URL</code> and{" "}
                <code className="text-neon-cyan">SUPABASE_ANON_KEY</code>, and that migration{" "}
                <code className="text-neon-cyan">0003_public_read.sql</code> was applied.
              </>
            ) : (
              <>
                Run <strong>Agents — Analytics</strong> under Actions (not the CI “agents” lint
                job). It saves your report to Supabase; refresh this page after it succeeds.
              </>
            )}
          </p>
        </Panel>
      </div>
    );
  }

  const avgEr = Number(live.avgEngagementRate) || 0;
  const erPct = `${(avgEr * 100).toFixed(1)}%`;
  const bestTime =
    live.bestHourUtc === null || live.bestHourUtc === undefined
      ? "—"
      : `${String(live.bestHourUtc).padStart(2, "0")}:00 UTC`;
  const topPosts = Array.isArray(live.topPosts) ? live.topPosts : [];
  const recommendations = Array.isArray(live.recommendations) ? live.recommendations : [];

  return (
    <div>
      <TopBar
        title="Analytics"
        subtitle={`Live @cineai_diaries — ${live.postsAnalyzed} posts (from daily analytics cron)`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatPill
          label="Followers"
          value={formatCompact(Number(live.followers) || 0)}
          accent="pink"
        />
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
          {topPosts.length > 0 ? (
            <TopPostsChart
              data={topPosts.map((p) => ({
                label: (p.hook || "").slice(0, 24) || String(p.id).slice(-6),
                engagement: Math.round((Number(p.engagementRate) || 0) * 1000) / 10,
                reach: Number(p.reach) || 0,
              }))}
            />
          ) : (
            <p className="text-sm text-ink-dim">No top posts in this snapshot yet.</p>
          )}
        </Panel>
        <Panel title="Growth recommendations" subtitle="From daily analytics cron">
          <ul className="space-y-3 text-sm text-ink-dim">
            {recommendations.map((r, i) => (
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
            {topPosts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                {p.permalink ? (
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-ink hover:text-neon-cyan"
                  >
                    {p.hook || p.id}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {p.hook || p.id}
                  </span>
                )}
                <span className="shrink-0 text-xs text-ink-dim">
                  <span className="text-neon-green">
                    {((Number(p.engagementRate) || 0) * 100).toFixed(1)}%
                  </span>{" "}
                  · {formatCompact(Number(p.reach) || 0)} reach
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
