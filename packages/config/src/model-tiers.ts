import type { ModelTier } from "@aicos/shared-types";

// Task -> default model tier. This is the single source of truth that both the
// TS API gateway and the Python model router read from (Python mirrors it).
export const TASK_TIER_MAP = {
  classification: "local",
  tagging: "local",
  summarization: "local",
  dedupe: "local",
  sentiment: "local",
  metadata_extraction: "local",
  formatting: "local",
  trend_classification: "local",
  caption_cleanup: "mid",
  ideation: "mid",
  strategy_refinement: "mid",
  final_content: "premium",
  viral_optimization: "premium",
  long_form: "premium",
} as const satisfies Record<string, ModelTier>;

export type TaskType = keyof typeof TASK_TIER_MAP;

// Concrete model + rough $/1K-token pricing used for cost estimation.
// Premium tiers are escalated to ONLY when the opportunity score justifies it.
export interface TierModel {
  tier: ModelTier;
  provider: "ollama" | "anthropic";
  model: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
}

export const TIER_MODELS: Record<ModelTier, TierModel> = {
  local: {
    tier: "local",
    provider: "ollama",
    model: "llama3:8b",
    inputCostPer1k: 0,
    outputCostPer1k: 0,
  },
  mid: {
    tier: "mid",
    provider: "anthropic",
    model: "claude-haiku-4-5",
    inputCostPer1k: 0.0008,
    outputCostPer1k: 0.004,
  },
  premium: {
    tier: "premium",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
  },
};

// Auto-downgrade ladder applied by the budget guard when limits are hit.
export const DOWNGRADE_LADDER: ModelTier[] = ["premium", "mid", "local"];
