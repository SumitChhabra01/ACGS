"""Model-tier + budget config. Mirrors packages/config (TS) — keep in sync.

This is the single source of truth the Python agents read for routing and cost.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from enum import StrEnum


class Tier(StrEnum):
    LOCAL = "local"
    MID = "mid"
    PREMIUM = "premium"


# Task -> default tier. Cheapest capable tier wins.
TASK_TIER_MAP: dict[str, Tier] = {
    "classification": Tier.LOCAL,
    "tagging": Tier.LOCAL,
    "summarization": Tier.LOCAL,
    "dedupe": Tier.LOCAL,
    "sentiment": Tier.LOCAL,
    "metadata_extraction": Tier.LOCAL,
    "formatting": Tier.LOCAL,
    "trend_classification": Tier.LOCAL,
    "caption_cleanup": Tier.MID,
    "ideation": Tier.MID,
    "strategy_refinement": Tier.MID,
    "final_content": Tier.PREMIUM,
    "viral_optimization": Tier.PREMIUM,
    "long_form": Tier.PREMIUM,
}


@dataclass(frozen=True)
class TierModel:
    tier: Tier
    provider: str  # "ollama" | "anthropic"
    model: str
    input_cost_per_1k: float
    output_cost_per_1k: float


# Local model used for the LOCAL tier (and all tiers when LLM_PROVIDER=ollama).
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3:8b")

# Set LLM_PROVIDER=ollama to run the ENTIRE pipeline on the local model for $0
# (no Anthropic credits needed). Otherwise mid/premium use Anthropic Claude.
_LOCAL_ONLY = os.environ.get("LLM_PROVIDER", "").lower() == "ollama"


def _tier_model(tier: Tier, anthropic_model: str, in_cost: float, out_cost: float) -> TierModel:
    if _LOCAL_ONLY:
        return TierModel(tier, "ollama", OLLAMA_MODEL, 0.0, 0.0)
    return TierModel(tier, "anthropic", anthropic_model, in_cost, out_cost)


TIER_MODELS: dict[Tier, TierModel] = {
    Tier.LOCAL: TierModel(Tier.LOCAL, "ollama", OLLAMA_MODEL, 0.0, 0.0),
    Tier.MID: _tier_model(Tier.MID, "claude-haiku-4-5", 0.0008, 0.004),
    Tier.PREMIUM: _tier_model(Tier.PREMIUM, "claude-sonnet-4-5", 0.003, 0.015),
}

# Auto-downgrade ladder applied by the budget guard.
DOWNGRADE_LADDER: list[Tier] = [Tier.PREMIUM, Tier.MID, Tier.LOCAL]

DOWNGRADE_THRESHOLDS = {
    "soft_warn": 0.70,
    "downgrade": 0.85,
    "pause_low_priority": 0.95,
    "hard_stop": 1.00,
}

DEFAULT_BUDGET = {
    "daily_limit": 15.0,
    "monthly_limit": 300.0,
}


def env(key: str, default: str | None = None) -> str | None:
    return os.environ.get(key, default)


def has_anthropic() -> bool:
    return bool(env("ANTHROPIC_API_KEY"))
