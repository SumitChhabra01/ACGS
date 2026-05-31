"""Smoke tests for the cost-control core. Run offline (mock LLM)."""
from __future__ import annotations

from agents.orchestrator import Orchestrator
from core.budget_guard import BudgetGuard
from core.cache import cache, cache_key
from core.config import Tier
from core.model_router import ModelRouter
from core.validation import validate


def test_budget_downgrade_ladder():
    guard = BudgetGuard(daily_limit=10.0)
    # 88% spent (>= downgrade 0.85, < pause 0.95) -> premium steps down a rung.
    guard.daily_spend = 8.8
    assert guard.effective_tier(Tier.PREMIUM) in (Tier.MID, Tier.LOCAL)
    # 96% spent (>= pause 0.95) -> low-priority work is paused entirely.
    guard.daily_spend = 9.6
    assert guard.effective_tier(Tier.PREMIUM, low_priority=True) is None


def test_budget_ok_passthrough():
    guard = BudgetGuard(daily_limit=100.0)
    assert guard.effective_tier(Tier.PREMIUM) is Tier.PREMIUM


def test_cache_hit_short_circuits_cost():
    router = ModelRouter(BudgetGuard(daily_limit=100.0))
    r1 = router.generate(task_type="ideation", prompt="hello world", agent="t")
    r2 = router.generate(task_type="ideation", prompt="hello world", agent="t")
    assert r1.cached is False
    assert r2.cached is True
    assert r2.cost == 0.0


def test_cache_key_stable():
    a = cache_key("ideation", {"prompt": "x"}, "b", "mid")
    b = cache_key("ideation", {"prompt": "x"}, "b", "mid")
    assert a == b


def test_validation_limits():
    res = validate("instagram_caption", "Follow for more! #ai")
    assert res.scores["platformOk"] is True
    long = validate("instagram_caption", "x" * 5000)
    assert long.passed is False


def test_orchestrator_runs_offline():
    out = Orchestrator().run_workflow("content")
    assert "drafts" in out
    valid_states = {"ok", "warn", "downgrading", "pausing_low_priority", "hard_stop"}
    assert out["budget"]["state"] in valid_states


def test_analytics_agent_offline(monkeypatch):
    # Force offline regardless of any live token in the local environment.
    monkeypatch.delenv("META_ACCESS_TOKEN", raising=False)
    out = Orchestrator().run_workflow("analytics")
    res = out["result"]["output"]
    assert res["posts_analyzed"] == 4
    assert "best_hour_utc" in res
    assert len(res["recommendations"]) > 0
    assert res["source"].startswith("mock")


def test_growth_engagement_rate():
    from core.growth import PostStat, analyze

    posts = [
        PostStat("a", "Hook one", "2026-05-20T18:00:00Z", 100, 10, 1000, 20, "REELS"),
        PostStat("b", "Hook two", "2026-05-21T09:00:00Z", 10, 1, 1000, 2, "FEED"),
    ]
    res = analyze(posts, followers=500)
    assert res["top_posts"][0]["id"] == "a"  # higher engagement ranks first
    assert res["best_format"] == "REELS"


def test_local_tier_is_free():
    router = ModelRouter(BudgetGuard())
    r = router.generate(task_type="classification", prompt="classify me", agent="t")
    assert r.tier is Tier.LOCAL
    assert r.cost == 0.0
    cache._store.clear()
