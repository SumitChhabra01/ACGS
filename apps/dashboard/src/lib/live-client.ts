"use client";

import type {
  AgentName,
  AgentRuntimeState,
  ContentItem,
  ModelTier,
  Trend,
} from "@aicos/shared-types";
import { createClient } from "@/lib/supabase/client";
import { normalizeGrowthReport } from "@/lib/analytics-payload";
import type { GrowthReport } from "@/lib/growth";
import { mapContent, mapTrend, round } from "@/lib/mappers";
import type { BurnPoint, UsageSummary } from "@/lib/queries";

const ALL_AGENTS: AgentName[] = [
  "orchestrator",
  "trend",
  "strategy",
  "content",
  "image",
  "publishing",
  "analytics",
  "learning",
];

const ACTIVE_WINDOW_MS = 6 * 60 * 60 * 1000; // match 6h trend cron

function sb() {
  return createClient();
}

export async function fetchContent(): Promise<ContentItem[]> {
  const client = sb();
  if (!client) return [];
  const { data, error } = await client
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map((row) => mapContent(row as Record<string, unknown>));
}

export async function fetchTrends(): Promise<Trend[]> {
  const client = sb();
  if (!client) return [];
  const { data, error } = await client
    .from("trends")
    .select("*")
    .order("opportunity_score", { ascending: false })
    .limit(8);
  if (error || !data) return [];
  return data.map((row) => mapTrend(row as Record<string, unknown>));
}

export async function fetchUsageSummary(): Promise<UsageSummary | null> {
  const client = sb();
  if (!client) return null;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [usageRes, budgetRes] = await Promise.all([
    client
      .from("ai_usage")
      .select("model_tier,input_tokens,output_tokens,cost_estimate,created_at")
      .gte("created_at", startOfMonth.toISOString()),
    client.from("budgets").select("daily_limit,monthly_limit").eq("scope", "global").limit(1).maybeSingle(),
  ]);

  if (usageRes.error || !usageRes.data) return null;

  const tiers: ModelTier[] = ["local", "mid", "premium"];
  const byTier = tiers.map((tier) => ({ tier, calls: 0, cost: 0 }));
  let dailySpend = 0;
  let monthlySpend = 0;
  let tokensToday = 0;
  const dayIso = startOfDay.toISOString();

  for (const r of usageRes.data) {
    const cost = Number(r.cost_estimate ?? 0);
    monthlySpend += cost;
    const bucket = byTier.find((b) => b.tier === r.model_tier);
    if (bucket) {
      bucket.calls += 1;
      bucket.cost += cost;
    }
    if (String(r.created_at) >= dayIso) {
      dailySpend += cost;
      tokensToday += Number(r.input_tokens ?? 0) + Number(r.output_tokens ?? 0);
    }
  }

  return {
    dailySpend: round(dailySpend),
    dailyLimit: Number(budgetRes.data?.daily_limit ?? 15),
    monthlySpend: round(monthlySpend),
    monthlyLimit: Number(budgetRes.data?.monthly_limit ?? 300),
    tokensToday,
    byTier: byTier.map((b) => ({ ...b, cost: round(b.cost) })),
  };
}

export async function fetchBurnSeries(): Promise<BurnPoint[]> {
  const client = sb();
  if (!client) return [];

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await client
    .from("ai_usage")
    .select("model_tier,cost_estimate,created_at")
    .gte("created_at", since.toISOString());
  if (error || !data) return [];

  const byDay = new Map<string, BurnPoint>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { day: key.slice(5), local: 0, mid: 0, premium: 0 });
  }
  for (const r of data) {
    const key = String(r.created_at).slice(0, 10);
    const point = byDay.get(key);
    const tier = r.model_tier as ModelTier;
    if (point && (tier === "local" || tier === "mid" || tier === "premium")) {
      point[tier] = round(point[tier] + Number(r.cost_estimate ?? 0));
    }
  }
  return [...byDay.values()];
}

export async function fetchAgents(): Promise<AgentRuntimeState[]> {
  const client = sb();
  if (!client) return [];

  const since = new Date();
  since.setDate(since.getDate() - 2);
  const { data, error } = await client
    .from("ai_usage")
    .select("agent,created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const lastRun = new Map<string, string>();
  for (const r of data) {
    if (!lastRun.has(r.agent)) lastRun.set(r.agent, String(r.created_at));
  }

  const now = Date.now();
  return ALL_AGENTS.map((agent) => {
    const last = lastRun.get(agent) ?? null;
    const activeRecently = last ? now - new Date(last).getTime() < ACTIVE_WINDOW_MS : false;
    return {
      agent,
      status: activeRecently ? "active" : "idle",
      lastRunAt: last,
      lastError: null,
      queueDepth: 0,
    };
  });
}

export async function fetchLatestAnalytics(): Promise<GrowthReport | null> {
  const client = sb();
  if (!client) return null;
  const { data, error } = await client
    .from("cache_entries")
    .select("payload")
    .eq("key", "latest_analytics")
    .maybeSingle();
  if (error || !data?.payload) return null;
  return normalizeGrowthReport(data.payload);
}
