"""Trend agent: classify + score raw trend items into opportunities.

Uses the local (Tier-1) model for classification — the cheapest path. Trend
source fetching is stubbed with a small sample set for the MVP; Phase 2 wires
Reddit / Google Trends / YouTube fetchers behind the same interface.
"""
from __future__ import annotations

import json
import re
from typing import Any

from core.prompts import render

from .base import Agent

_SAMPLE_TRENDS = [
    {"source": "Reddit", "text": "AI agents replacing SaaS dashboards"},
    {"source": "YouTube", "text": "Cinematic AI b-roll workflows"},
    {"source": "Google Trends", "text": "On-device LLMs for privacy"},
    {"source": "X", "text": "Prompt caching cost savings"},
]


def _extract_scores(text: str) -> tuple[int, int]:
    """Pull viral/opportunity scores from model JSON; fall back to heuristics."""
    try:
        match = re.search(r"\{.*\}", text, re.S)
        data = json.loads(match.group(0)) if match else {}
        viral = int(data.get("viral_score", 60))
        opp = int(data.get("opportunity_score", 60))
        return viral, opp
    except Exception:  # noqa: BLE001
        return 60, 60


class TrendAgent(Agent):
    name = "trend"

    def run(
        self,
        *,
        niche: str = "AI tools",
        items: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        items = items or _SAMPLE_TRENDS
        results = []
        for item in items:
            prompt = render("trend_classify", niche=niche, item=item["text"])
            r = self.router.generate(
                task_type="trend_classification",
                prompt=prompt,
                brand_id=self.brand_id,
                agent=self.name,
                low_priority=True,
            )
            viral, opp = _extract_scores(r.text)
            results.append(
                {
                    "source": item["source"],
                    "topic": item["text"],
                    "viral_score": viral,
                    "opportunity_score": opp,
                    "tier": r.tier.value,
                    "cached": r.cached,
                }
            )
        results.sort(key=lambda x: x["opportunity_score"], reverse=True)
        return {"trends": results, "count": len(results)}
