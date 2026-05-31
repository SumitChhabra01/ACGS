"""Analytics agent: pull Instagram media + insights and compute growth signals.

When Instagram credentials are configured it fetches live data via the Graph API.
Otherwise it runs on a small mock dataset so the pipeline (and CI) works offline.
The output feeds the learning agent and the dashboard analytics view.
"""
from __future__ import annotations

from typing import Any

from core.growth import PostStat, analyze
from integrations import instagram as ig

from .base import Agent

# Offline sample so `python run.py analytics` works before the account is connected.
_MOCK_POSTS = [
    PostStat(
        id="m1",
        caption="5 signs your SaaS is about to be replaced by an AI agent",
        timestamp="2026-05-20T18:30:00Z",
        likes=420,
        comments=38,
        reach=5200,
        saves=110,
        media_product_type="REELS",
    ),
    PostStat(
        id="m2",
        caption="The cheapest AI call is the one you never make",
        timestamp="2026-05-22T09:15:00Z",
        likes=180,
        comments=12,
        reach=3100,
        saves=40,
        media_product_type="FEED",
    ),
    PostStat(
        id="m3",
        caption="I automated a media company with $100/month",
        timestamp="2026-05-24T19:00:00Z",
        likes=690,
        comments=73,
        reach=8800,
        saves=210,
        media_product_type="REELS",
    ),
    PostStat(
        id="m4",
        caption="On-device LLMs keep your data private",
        timestamp="2026-05-26T12:45:00Z",
        likes=150,
        comments=9,
        reach=2600,
        saves=28,
        media_product_type="FEED",
    ),
]


class AnalyticsAgent(Agent):
    name = "analytics"

    def run(self, *, limit: int = 25) -> dict[str, Any]:
        if not ig.is_configured():
            result = analyze(_MOCK_POSTS, followers=842)
            result["source"] = "mock (Instagram not connected — see docs/INSTAGRAM_SETUP.md)"
            return result

        try:
            return self._run_live(limit=limit)
        except ig.InstagramApiError as exc:
            # Token expired / revoked — degrade gracefully instead of crashing.
            result = analyze(_MOCK_POSTS, followers=842)
            result["source"] = f"mock (Instagram error: {exc} — refresh META_ACCESS_TOKEN)"
            return result

    def _run_live(self, *, limit: int = 25) -> dict[str, Any]:
        creds = ig.IgCredentials.from_env()
        account = ig.get_account(creds)
        media = ig.get_media(creds, limit=limit, with_insights=True)

        posts = [
            PostStat(
                id=m.id,
                caption=m.caption,
                timestamp=m.timestamp,
                likes=m.insights.get("likes", m.like_count),
                comments=m.insights.get("comments", m.comments_count),
                reach=m.insights.get("reach", 0),
                saves=m.insights.get("saved", 0),
                media_product_type=m.media_product_type,
                permalink=m.permalink,
            )
            for m in media
        ]
        result = analyze(
            posts,
            followers=int(account.get("followers_count", 0)),
            media_count=int(account.get("media_count", 0)),
        )
        result["source"] = "instagram"
        result["account"] = {
            "username": account.get("username"),
            "followers_count": account.get("followers_count"),
            "media_count": account.get("media_count"),
        }
        return result
