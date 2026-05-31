import type { GrowthReport } from "@/lib/growth";

/** Raw payload from Python analytics agent (snake_case) or TS analyze() (camelCase). */
type RawPayload = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeTopPost(row: unknown): GrowthReport["topPosts"][number] | null {
  if (!row || typeof row !== "object") return null;
  const p = row as Record<string, unknown>;
  const id = str(p.id, "unknown");
  return {
    id,
    hook: str(p.hook ?? p.caption, ""),
    permalink: str(p.permalink, ""),
    engagementRate: num(p.engagement_rate ?? p.engagementRate, 0),
    reach: num(p.reach, 0),
  };
}

/**
 * Converts Supabase cache_entries payload to the dashboard GrowthReport shape.
 * Python cron writes snake_case; local Instagram path uses camelCase.
 */
export function normalizeGrowthReport(raw: unknown): GrowthReport | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as RawPayload;

  const postsAnalyzed = num(
    p.posts_analyzed ?? p.postsAnalyzed,
    0,
  );
  const followers = num(
    p.followers ??
      (typeof p.account === "object" && p.account !== null
        ? (p.account as RawPayload).followers_count
        : undefined),
    0,
  );
  const mediaCount = num(
    p.media_count ??
      p.mediaCount ??
      (typeof p.account === "object" && p.account !== null
        ? (p.account as RawPayload).media_count
        : undefined),
    0,
  );

  const rawTop = (p.top_posts ?? p.topPosts) as unknown;
  const topPosts = Array.isArray(rawTop)
    ? rawTop.map(normalizeTopPost).filter((x): x is NonNullable<typeof x> => x !== null)
    : [];

  const rawRecs = p.recommendations;
  const recommendations = Array.isArray(rawRecs)
    ? rawRecs.map((r) => String(r))
    : typeof p.summary === "string"
      ? [p.summary]
      : [];

  const hasData =
    postsAnalyzed > 0 ||
    topPosts.length > 0 ||
    recommendations.length > 0 ||
    followers > 0 ||
    mediaCount > 0;
  if (!hasData) return null;

  const bestHour = p.best_hour_utc ?? p.bestHourUtc;
  const bestHourUtc =
    bestHour === null || bestHour === undefined ? null : num(bestHour, 0);

  return {
    postsAnalyzed,
    followers,
    mediaCount,
    avgEngagementRate: num(p.avg_engagement_rate ?? p.avgEngagementRate, 0),
    bestHourUtc,
    bestWeekday:
      typeof (p.best_weekday ?? p.bestWeekday) === "string"
        ? String(p.best_weekday ?? p.bestWeekday)
        : null,
    bestFormat:
      typeof (p.best_format ?? p.bestFormat) === "string"
        ? String(p.best_format ?? p.bestFormat)
        : null,
    topPosts,
    recommendations,
  };
}
