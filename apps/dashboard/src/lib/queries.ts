import type {
  AgentName,
  AgentRuntimeState,
  ContentItem,
  ModelTier,
  Trend,
} from "@aicos/shared-types";
import { createClient, isConfigured } from "@/lib/supabase/server";
import {
  demoAgents,
  demoBurnSeries,
  demoContent,
  demoTrends,
  demoUsage,
} from "@/lib/demo-data";

// Central read layer: every getter pulls from Supabase when configured and
// falls back to deterministic demo data otherwise (or on error / empty table),
// so the dashboard always renders. snake_case DB rows are mapped to camelCase.

export interface DataMode {
  live: boolean;
}

export async function getDataMode(): Promise<DataMode> {
  return { live: isConfigured() };
}

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

export async function getContent(): Promise<ContentItem[]> {
  const sb = await createClient();
  if (!sb) return demoContent;
  const { data, error } = await sb
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data || data.length === 0) return demoContent;
  return data.map(mapContent);
}

export async function getTrends(): Promise<Trend[]> {
  const sb = await createClient();
  if (!sb) return demoTrends;
  const { data, error } = await sb
    .from("trends")
    .select("*")
    .order("opportunity_score", { ascending: false })
    .limit(8);
  if (error || !data || data.length === 0) return demoTrends;
  return data.map(mapTrend);
}

export interface UsageSummary {
  dailySpend: number;
  dailyLimit: number;
  monthlySpend: number;
  monthlyLimit: number;
  tokensToday: number;
  byTier: { tier: ModelTier; calls: number; cost: number }[];
}

export async function getUsageSummary(): Promise<UsageSummary> {
  const sb = await createClient();
  if (!sb) return demoUsage as UsageSummary;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: rows, error }, limits] = await Promise.all([
    sb
      .from("ai_usage")
      .select("model_tier,input_tokens,output_tokens,cost_estimate,created_at")
      .gte("created_at", startOfMonth.toISOString()),
    getGlobalBudget(sb),
  ]);

  if (error || !rows) return demoUsage as UsageSummary;

  const tiers: ModelTier[] = ["local", "mid", "premium"];
  const byTier = tiers.map((tier) => ({ tier, calls: 0, cost: 0 }));
  let dailySpend = 0;
  let monthlySpend = 0;
  let tokensToday = 0;
  const dayIso = startOfDay.toISOString();

  for (const r of rows) {
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
    dailyLimit: limits.dailyLimit,
    monthlySpend: round(monthlySpend),
    monthlyLimit: limits.monthlyLimit,
    tokensToday,
    byTier: byTier.map((b) => ({ ...b, cost: round(b.cost) })),
  };
}

export interface BurnPoint {
  day: string;
  local: number;
  mid: number;
  premium: number;
}

export async function getBurnSeries(): Promise<BurnPoint[]> {
  const sb = await createClient();
  if (!sb) return demoBurnSeries;

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await sb
    .from("ai_usage")
    .select("model_tier,cost_estimate,created_at")
    .gte("created_at", since.toISOString());
  if (error || !data || data.length === 0) return demoBurnSeries;

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

export async function getAgents(): Promise<AgentRuntimeState[]> {
  const sb = await createClient();
  if (!sb) return demoAgents;

  // Derive runtime state from recent ai_usage: most recent run per agent.
  const since = new Date();
  since.setDate(since.getDate() - 2);
  const { data, error } = await sb
    .from("ai_usage")
    .select("agent,created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  if (error || !data) return demoAgents;

  const lastRun = new Map<string, string>();
  for (const r of data) {
    if (!lastRun.has(r.agent)) lastRun.set(r.agent, String(r.created_at));
  }

  const now = Date.now();
  return ALL_AGENTS.map((agent) => {
    const last = lastRun.get(agent) ?? null;
    const activeRecently = last ? now - new Date(last).getTime() < 5 * 60_000 : false;
    return {
      agent,
      status: activeRecently ? "active" : "idle",
      lastRunAt: last,
      lastError: null,
      queueDepth: 0,
    };
  });
}

// --- helpers ---------------------------------------------------------------

async function getGlobalBudget(
  sb: NonNullable<Awaited<ReturnType<typeof createClient>>>,
): Promise<{ dailyLimit: number; monthlyLimit: number }> {
  const { data } = await sb
    .from("budgets")
    .select("daily_limit,monthly_limit")
    .eq("scope", "global")
    .limit(1)
    .maybeSingle();
  return {
    dailyLimit: Number(data?.daily_limit ?? 15),
    monthlyLimit: Number(data?.monthly_limit ?? 300),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function mapContent(row: Record<string, unknown>): ContentItem {
  return {
    id: String(row.id),
    brandId: String(row.brand_id ?? ""),
    strategyId: (row.strategy_id as string | null) ?? null,
    platform: row.platform as ContentItem["platform"],
    type: row.type as ContentItem["type"],
    body: String(row.body ?? ""),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    qualityScores: (row.quality_scores as ContentItem["qualityScores"]) ?? null,
    status: row.status as ContentItem["status"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapTrend(row: Record<string, unknown>): Trend {
  return {
    id: String(row.id),
    brandId: String(row.brand_id ?? ""),
    source: String(row.source ?? ""),
    topic: String(row.topic ?? ""),
    viralScore: Number(row.viral_score ?? 0),
    opportunityScore: Number(row.opportunity_score ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}
