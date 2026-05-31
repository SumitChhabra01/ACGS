"""Turn raw post metrics into actionable growth recommendations.

Deterministic, cheap analysis (no LLM needed for the math). The learning agent
later uses these signals to tune prompts, posting times, and content cadence.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class PostStat:
    id: str
    caption: str
    timestamp: str  # ISO 8601 from the Graph API
    likes: int
    comments: int
    reach: int
    saves: int
    media_product_type: str
    permalink: str = ""

    @property
    def interactions(self) -> int:
        return self.likes + self.comments + self.saves

    @property
    def engagement_rate(self) -> float:
        if self.reach <= 0:
            return 0.0
        return round(self.interactions / self.reach, 4)

    @property
    def hour(self) -> int | None:
        try:
            return datetime.fromisoformat(self.timestamp.replace("Z", "+00:00")).hour
        except ValueError:
            return None

    @property
    def weekday(self) -> str | None:
        try:
            dt = datetime.fromisoformat(self.timestamp.replace("Z", "+00:00"))
            return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][dt.weekday()]
        except ValueError:
            return None


def _first_line(caption: str) -> str:
    return (caption or "").strip().splitlines()[0][:80] if caption else ""


def analyze(
    posts: list[PostStat],
    followers: int | None = None,
    media_count: int | None = None,
) -> dict[str, Any]:
    if not posts:
        return {"summary": "No posts to analyze yet.", "recommendations": []}

    ranked = sorted(posts, key=lambda p: p.engagement_rate, reverse=True)
    avg_er = round(sum(p.engagement_rate for p in posts) / len(posts), 4)

    # Best posting window by average engagement rate per hour bucket.
    by_hour: dict[int, list[float]] = defaultdict(list)
    by_weekday: dict[str, list[float]] = defaultdict(list)
    for p in posts:
        if p.hour is not None:
            by_hour[p.hour].append(p.engagement_rate)
        if p.weekday is not None:
            by_weekday[p.weekday].append(p.engagement_rate)

    best_hour = _best_bucket(by_hour)
    best_weekday = _best_bucket(by_weekday)

    # Format performance: reels vs feed.
    by_type: dict[str, list[float]] = defaultdict(list)
    for p in posts:
        by_type[p.media_product_type].append(p.engagement_rate)
    best_format = _best_bucket(by_type)

    recommendations = _recommend(
        avg_er=avg_er,
        best_hour=best_hour,
        best_weekday=best_weekday,
        best_format=best_format,
        top=ranked[:3],
        followers=followers,
    )

    return {
        "posts_analyzed": len(posts),
        "followers": followers,
        "media_count": media_count,
        "avg_engagement_rate": avg_er,
        "best_hour_utc": best_hour,
        "best_weekday": best_weekday,
        "best_format": best_format,
        "top_posts": [
            {
                "id": p.id,
                "hook": _first_line(p.caption),
                "permalink": p.permalink,
                "engagement_rate": p.engagement_rate,
                "reach": p.reach,
            }
            for p in ranked[:3]
        ],
        "recommendations": recommendations,
    }


def _best_bucket(buckets: dict[Any, list[float]]) -> Any | None:
    if not buckets:
        return None
    return max(buckets.items(), key=lambda kv: sum(kv[1]) / len(kv[1]))[0]


def _recommend(
    *,
    avg_er: float,
    best_hour: int | None,
    best_weekday: str | None,
    best_format: str | None,
    top: list[PostStat],
    followers: int | None,
) -> list[str]:
    recs: list[str] = []
    if best_hour is not None:
        recs.append(f"Post around {best_hour:02d}:00 UTC — your highest avg engagement window.")
    if best_weekday:
        recs.append(f"{best_weekday} is your strongest day; prioritize key posts then.")
    if best_format:
        recs.append(f"{best_format} outperforms other formats for you — lean into it.")
    if top:
        hooks = "; ".join(f'"{_first_line(p.caption)}"' for p in top if p.caption)
        if hooks:
            recs.append(f"Reuse winning hook patterns from top posts: {hooks}.")
    if avg_er < 0.02:
        recs.append("Engagement rate is low (<2%) — add a clear CTA and a stronger first line.")
    elif avg_er > 0.06:
        recs.append("Strong engagement (>6%) — increase cadence to compound growth.")
    if followers is not None and followers < 1000:
        recs.append(
            "Under 1K followers: post consistently (4-7x/week) and engage in comments daily."
        )
    return recs
