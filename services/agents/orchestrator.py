"""Orchestrator: deterministic, event-driven coordination of the agent set.

No autonomous loops, no recursive agent chat. It dispatches a fixed workflow,
collects results, and reports cost. Each workflow maps to a GitHub Actions
schedule (trends=6h, content=12h, analytics=daily) or a manual admin command.
"""
from __future__ import annotations

from typing import Any

from core.budget_guard import BudgetGuard
from core.model_router import ModelRouter
from integrations import store

from .analytics import AnalyticsAgent
from .base import AgentResult
from .content import ContentAgent
from .trend import TrendAgent


class Orchestrator:
    def __init__(self, brand_id: str = "default", niche: str = "AI tools") -> None:
        self.guard = BudgetGuard()
        self.router = ModelRouter(self.guard)
        self.brand_id = brand_id
        self.niche = niche

    def run_trends(self) -> AgentResult:
        res = TrendAgent(self.router, self.brand_id).execute(niche=self.niche)
        store.save_trends(res.output.get("trends", []))
        return res

    def run_content_from_trends(self, max_items: int = 3) -> dict[str, Any]:
        trend_result = self.run_trends()
        trends = trend_result.output.get("trends", [])[:max_items]
        drafts: list[AgentResult] = []
        agent = ContentAgent(self.router, self.brand_id)
        for t in trends:
            drafts.append(
                agent.execute(
                    platform="instagram",
                    content_type="instagram_caption",
                    strategy=t["topic"],
                    opportunity_score=t["opportunity_score"],
                )
            )
        draft_dicts = [d.output for d in drafts]
        saved = store.save_content_items(draft_dicts)
        return {
            "trends": trend_result.output,
            "drafts": [d.__dict__ for d in drafts],
            "persisted": saved,
            "budget": self.guard.status(),
        }

    def run_analytics(self) -> AgentResult:
        res = AnalyticsAgent(self.router, self.brand_id).execute()
        store.save_audit_log(
            agent="analytics",
            action="analytics_run",
            detail={
                "source": res.output.get("source"),
                "posts_analyzed": res.output.get("posts_analyzed"),
                "followers": res.output.get("followers"),
                "recommendations": res.output.get("recommendations", [])[:5],
            },
        )
        store.save_latest_analytics(res.output)
        return res

    def run_reel_ideas(
        self,
        count: int = 3,
        voice: str = "cinematic, emotional travel storytelling",
    ) -> dict[str, Any]:
        """Draft Reels scripts that build on the account's top-performing hooks."""
        analytics = self.run_analytics()
        top = analytics.output.get("top_posts", [])[:count]
        agent = ContentAgent(self.router, self.brand_id)
        drafts = []
        for p in top:
            hook = p.get("hook", "")
            drafts.append(
                agent.execute(
                    platform="instagram",
                    content_type="instagram_reel_script",
                    strategy=f"Build on this proven hook pattern from a top post: {hook}",
                    voice=voice,
                    opportunity_score=85,
                ).__dict__
            )
        saved = store.save_content_items([d.get("output", {}) for d in drafts])
        return {
            "based_on_hooks": [p.get("hook") for p in top],
            "drafts": drafts,
            "persisted": saved,
            "budget": self.guard.status(),
        }

    def run_workflow(self, workflow: str) -> dict[str, Any]:
        if workflow == "trends":
            res = self.run_trends()
            return {"result": res.__dict__, "budget": self.guard.status()}
        if workflow == "content":
            return self.run_content_from_trends()
        if workflow == "analytics":
            res = self.run_analytics()
            return {"result": res.__dict__, "budget": self.guard.status()}
        if workflow == "ideas":
            return self.run_reel_ideas()
        raise ValueError(f"unknown workflow: {workflow}")
