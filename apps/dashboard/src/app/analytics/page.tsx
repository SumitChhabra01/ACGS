import { TopBar } from "@/components/layout/TopBar";
import { Panel, StatPill } from "@/components/ui/Panel";
import { EngagementChart } from "@/components/widgets/EngagementChart";
import { TopPostsChart } from "@/components/widgets/TopPostsChart";
import { demoAnalytics } from "@/lib/demo-data";
import { formatCompact } from "@/lib/utils";
import { getAccount, getMedia, isInstagramConfigured } from "@/lib/instagram";
import { analyze, toPostStat, type GrowthReport } from "@/lib/growth";
import { isPublicDemo } from "@/lib/site";

export const dynamic = "force-dynamic";

async function getLiveReport(): Promise<GrowthReport | null> {
  if (!isInstagramConfigured()) return null;
  try {
    const [account, media] = await Promise.all([getAccount(), getMedia(25)]);
    return analyze(media.map(toPostStat), account.followersCount, account.mediaCount);
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const live = await getLiveReport();

  if (!live) {
    const igTotal = demoAnalytics.reduce((s, d) => s + d.instagram, 0);
    const ytTotal = demoAnalytics.reduce((s, d) => s + d.youtube, 0);
    return (
      <div>
        <TopBar
          title="Analytics"
          subtitle={
            isPublicDemo
              ? "Public preview — sample metrics"
              : "Demo data — connect Instagram to see live @cineai_diaries metrics"
          }
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatPill label="IG reach (7d)" value={formatCompact(igTotal)} accent="pink" />
          <StatPill label="YT views (7d)" value={formatCompact(ytTotal)} accent="red" />
          <StatPill label="Avg viral score" value="78" accent="cyan" />
          <StatPill label="Best post time" value="6–8 PM" accent="green" />
        </div>
        <div className="mt-6">
          <Panel title="Engagement by day" subtitle="Reach / views per platform">
            <EngagementChart data={demoAnalytics} />
          </Panel>
        </div>
      </div>
    );
  }

  const erPct = `${(live.avgEngagementRate * 100).toFixed(1)}%`;
  const bestTime =
    live.bestHourUtc === null ? "—" : `${String(live.bestHourUtc).padStart(2, "0")}:00 UTC`;

  return (
    <div>
      <TopBar title="Analytics" subtitle="Live @cineai_diaries — feeds the growth engine" />

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

        <Panel title="Growth recommendations" subtitle="Data-driven, admin-gated">
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
