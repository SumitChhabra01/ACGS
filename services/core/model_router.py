"""The ONLY way agents call a model. Enforces tier routing, caching, and budget.

Flow per call:
  1. Resolve the requested tier from the task type.
  2. Ask the budget guard for the effective tier (may downgrade / pause).
  3. Check the cache (cache-before-regenerate). Return on hit.
  4. Dispatch to the correct provider (ollama vs anthropic).
  5. Record usage with the budget guard and store in cache.
"""
from __future__ import annotations

from dataclasses import dataclass

from integrations import store
from integrations.llm import call_anthropic, call_ollama

from .budget_guard import BudgetGuard
from .cache import cache, cache_key
from .config import TASK_TIER_MAP, TIER_MODELS, Tier


@dataclass
class RouterResult:
    text: str
    tier: Tier
    cost: float
    cached: bool
    input_tokens: int
    output_tokens: int


class ModelRouter:
    def __init__(self, guard: BudgetGuard | None = None) -> None:
        self.guard = guard or BudgetGuard()

    def generate(
        self,
        *,
        task_type: str,
        prompt: str,
        brand_id: str = "default",
        agent: str = "unknown",
        low_priority: bool = False,
        cache_ttl: int | None = 60 * 60 * 24,
        max_tokens: int = 800,
    ) -> RouterResult:
        requested = TASK_TIER_MAP.get(task_type, Tier.MID)
        tier = self.guard.effective_tier(requested, low_priority=low_priority)

        if tier is None:
            # Budget paused low-priority work; serve a clear signal to the caller.
            return RouterResult("[PAUSED:budget]", requested, 0.0, False, 0, 0)

        key = cache_key(
            task_type,
            {"prompt": prompt, "max_tokens": max_tokens},
            brand_id,
            tier.value,
        )
        hit = cache.get(key)
        if hit is not None:
            return RouterResult(hit, tier, 0.0, True, 0, 0)

        model = TIER_MODELS[tier]
        if model.provider == "ollama":
            text, in_tok, out_tok = call_ollama(model, prompt)
        else:
            text, in_tok, out_tok = call_anthropic(model, prompt, max_tokens=max_tokens)

        cost = self.guard.record(agent, tier, in_tok, out_tok)
        store.record_usage(
            agent=agent,
            model_tier=tier.value,
            input_tokens=in_tok,
            output_tokens=out_tok,
            cost=cost,
            workflow=task_type,
        )
        cache.set(key, text, ttl_seconds=cache_ttl)
        return RouterResult(text, tier, cost, False, in_tok, out_tok)
