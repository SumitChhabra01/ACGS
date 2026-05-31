import type { ContentItem, Trend } from "@aicos/shared-types";

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function mapContent(row: Record<string, unknown>): ContentItem {
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

export function mapTrend(row: Record<string, unknown>): Trend {
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
