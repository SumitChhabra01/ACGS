import type { RawMedia } from "./instagram";

// TS port of services/core/growth.py — turns raw IG media into growth signals.

export interface PostStat {
  id: string;
  caption: string;
  permalink: string;
  timestamp: string;
  likes: number;
  comments: number;
  reach: number;
  saves: number;
  views: number;
  productType: string;
  interactions: number;
  engagementRate: number;
}

export interface GrowthReport {
  postsAnalyzed: number;
  followers: number;
  mediaCount: number;
  avgEngagementRate: number;
  bestHourUtc: number | null;
  bestWeekday: string | null;
  bestFormat: string | null;
  topPosts: Array<{
    id: string;
    hook: string;
    permalink: string;
    engagementRate: number;
    reach: number;
  }>;
  recommendations: string[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toPostStat(m: RawMedia): PostStat {
  const likes = m.insights.likes ?? m.likeCount;
  const comments = m.insights.comments ?? m.commentsCount;
  const saves = m.insights.saved ?? 0;
  const reach = m.insights.reach ?? 0;
  const views = m.insights.views ?? 0;
  const interactions = likes + comments + saves;
  const engagementRate = reach > 0 ? Math.round((interactions / reach) * 10000) / 10000 : 0;
  return {
    id: m.id,
    caption: m.caption,
    permalink: m.permalink,
    timestamp: m.timestamp,
    likes,
    comments,
    reach,
    saves,
    views,
    productType: m.mediaProductType,
    interactions,
    engagementRate,
  };
}

function firstLine(caption: string): string {
  return (caption || "").trim().split("\n")[0]?.slice(0, 80) ?? "";
}

function bestBucket<T extends string | number>(buckets: Map<T, number[]>): T | null {
  let best: T | null = null;
  let bestAvg = -Infinity;
  for (const [key, vals] of buckets) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = key;
    }
  }
  return best;
}

export function analyze(posts: PostStat[], followers: number, mediaCount: number): GrowthReport {
  if (posts.length === 0) {
    return {
      postsAnalyzed: 0,
      followers,
      mediaCount,
      avgEngagementRate: 0,
      bestHourUtc: null,
      bestWeekday: null,
      bestFormat: null,
      topPosts: [],
      recommendations: ["No posts to analyze yet."],
    };
  }

  const ranked = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
  const avgEr =
    Math.round((posts.reduce((s, p) => s + p.engagementRate, 0) / posts.length) * 10000) / 10000;

  const byHour = new Map<number, number[]>();
  const byWeekday = new Map<string, number[]>();
  const byFormat = new Map<string, number[]>();
  for (const p of posts) {
    const d = new Date(p.timestamp);
    if (!Number.isNaN(d.getTime())) {
      push(byHour, d.getUTCHours(), p.engagementRate);
      push(byWeekday, WEEKDAYS[d.getUTCDay()] ?? "Sun", p.engagementRate);
    }
    push(byFormat, p.productType, p.engagementRate);
  }

  const bestHour = bestBucket(byHour);
  const bestWeekday = bestBucket(byWeekday);
  const bestFormat = bestBucket(byFormat);

  const recommendations: string[] = [];
  if (bestHour !== null) {
    const ist = istLabel(bestHour);
    recommendations.push(
      `Post around ${pad(bestHour)}:00 UTC (${ist} IST) — your highest avg engagement window.`,
    );
  }
  if (bestWeekday) recommendations.push(`${bestWeekday} is your strongest day; prioritize key posts then.`);
  if (bestFormat) recommendations.push(`${bestFormat} outperforms other formats — lean into it.`);
  const hooks = ranked.slice(0, 3).map((p) => firstLine(p.caption)).filter(Boolean);
  if (hooks.length) recommendations.push(`Reuse winning hook patterns: ${hooks.map((h) => `"${h}"`).join("; ")}.`);
  if (avgEr < 0.02) recommendations.push("Engagement <2% — add a clear CTA and a stronger first line.");
  else if (avgEr > 0.06) recommendations.push("Strong engagement (>6%) — increase cadence to compound growth.");
  if (followers < 1000) recommendations.push("Under 1K followers: post 4–7×/week and engage in comments daily.");

  return {
    postsAnalyzed: posts.length,
    followers,
    mediaCount,
    avgEngagementRate: avgEr,
    bestHourUtc: bestHour,
    bestWeekday,
    bestFormat,
    topPosts: ranked.slice(0, 5).map((p) => ({
      id: p.id,
      hook: firstLine(p.caption),
      permalink: p.permalink,
      engagementRate: p.engagementRate,
      reach: p.reach,
    })),
    recommendations,
  };
}

function push<T>(map: Map<T, number[]>, key: T, val: number) {
  const arr = map.get(key) ?? [];
  arr.push(val);
  map.set(key, arr);
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function istLabel(utcHour: number): string {
  const totalMin = (utcHour * 60 + 5 * 60 + 30) % (24 * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${pad(h)}:${pad(m)}`;
}
