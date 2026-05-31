"""Budget guard: tracks AI spend and enforces the auto-downgrade ladder.

Spend tracking is in-memory for local dev; in production it reads/writes the
`ai_usage` and `budgets` tables in Supabase. The guard never lets an agent
exceed the hard stop, and downgrades tiers as thresholds are crossed.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .config import (
    DEFAULT_BUDGET,
    DOWNGRADE_LADDER,
    DOWNGRADE_THRESHOLDS,
    TIER_MODELS,
    Tier,
)


@dataclass
class UsageRecord:
    agent: str
    tier: Tier
    input_tokens: int
    output_tokens: int
    cost: float


@dataclass
class BudgetGuard:
    daily_limit: float = DEFAULT_BUDGET["daily_limit"]
    monthly_limit: float = DEFAULT_BUDGET["monthly_limit"]
    daily_spend: float = 0.0
    monthly_spend: float = 0.0
    records: list[UsageRecord] = field(default_factory=list)

    def estimate_cost(self, tier: Tier, input_tokens: int, output_tokens: int) -> float:
        m = TIER_MODELS[tier]
        return (
            input_tokens / 1000 * m.input_cost_per_1k
            + output_tokens / 1000 * m.output_cost_per_1k
        )

    def daily_ratio(self) -> float:
        return self.daily_spend / self.daily_limit if self.daily_limit else 0.0

    def effective_tier(self, requested: Tier, *, low_priority: bool = False) -> Tier | None:
        """Apply the downgrade ladder based on current daily spend ratio.

        Returns None when low-priority work must be paused, or the (possibly
        downgraded) tier to use.
        """
        ratio = self.daily_ratio()

        if ratio >= DOWNGRADE_THRESHOLDS["hard_stop"]:
            return Tier.LOCAL  # only free/local work allowed at hard stop

        if ratio >= DOWNGRADE_THRESHOLDS["pause_low_priority"] and low_priority:
            return None

        if ratio >= DOWNGRADE_THRESHOLDS["downgrade"]:
            # Step one rung cheaper than requested.
            idx = DOWNGRADE_LADDER.index(requested)
            return DOWNGRADE_LADDER[min(idx + 1, len(DOWNGRADE_LADDER) - 1)]

        return requested

    def record(self, agent: str, tier: Tier, input_tokens: int, output_tokens: int) -> float:
        cost = self.estimate_cost(tier, input_tokens, output_tokens)
        self.daily_spend += cost
        self.monthly_spend += cost
        self.records.append(UsageRecord(agent, tier, input_tokens, output_tokens, cost))
        return cost

    def status(self) -> dict[str, float | str]:
        ratio = self.daily_ratio()
        if ratio >= DOWNGRADE_THRESHOLDS["hard_stop"]:
            state = "hard_stop"
        elif ratio >= DOWNGRADE_THRESHOLDS["pause_low_priority"]:
            state = "pausing_low_priority"
        elif ratio >= DOWNGRADE_THRESHOLDS["downgrade"]:
            state = "downgrading"
        elif ratio >= DOWNGRADE_THRESHOLDS["soft_warn"]:
            state = "warn"
        else:
            state = "ok"
        return {
            "daily_spend": round(self.daily_spend, 4),
            "daily_limit": self.daily_limit,
            "monthly_spend": round(self.monthly_spend, 4),
            "state": state,
        }
