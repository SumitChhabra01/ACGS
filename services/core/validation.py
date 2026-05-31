"""Deterministic validation layer. Every generated piece passes these checks
BEFORE it can move to pending_approval. Failures trigger at most ONE bounded
regeneration (handled by the agent), never an infinite loop.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Platform character limits (approximate, MVP).
PLATFORM_LIMITS = {
    "instagram_caption": 2200,
    "instagram_reel_script": 1500,
    "youtube_short_script": 1500,
    "youtube_description": 5000,
}

_TOXIC_TERMS = {"hate", "kill", "slur1", "slur2"}  # placeholder; swap for a real classifier


@dataclass
class ValidationResult:
    passed: bool
    scores: dict[str, float | bool]
    issues: list[str]


def _readability(text: str) -> float:
    words = text.split()
    if not words:
        return 0.0
    avg_word_len = sum(len(w) for w in words) / len(words)
    # Shorter words => more readable. Map ~3-8 chars to ~1.0-0.4.
    return max(0.0, min(1.0, 1.2 - (avg_word_len - 3) * 0.12))


def _seo(text: str) -> float:
    has_hashtags = "#" in text
    has_cta = bool(re.search(r"\b(follow|comment|share|subscribe|link|save)\b", text, re.I))
    length_ok = 80 <= len(text) <= 3000
    return round((has_hashtags + has_cta + length_ok) / 3, 2)


def _toxicity(text: str) -> float:
    lowered = text.lower()
    hits = sum(1 for t in _TOXIC_TERMS if t in lowered)
    return min(1.0, hits * 0.5)


def validate(
    content_type: str,
    body: str,
    existing_embeddings: list[float] | None = None,
) -> ValidationResult:
    issues: list[str] = []

    limit = PLATFORM_LIMITS.get(content_type, 3000)
    platform_ok = len(body) <= limit
    if not platform_ok:
        issues.append(f"exceeds {content_type} limit ({len(body)}/{limit})")

    toxicity = _toxicity(body)
    if toxicity >= 0.5:
        issues.append("toxicity flagged")

    # Duplicate score is wired to embeddings in Phase 2; 0.0 placeholder here.
    duplicate = 0.0

    seo = _seo(body)
    readability = _readability(body)
    # Simple engagement heuristic from hook presence + brevity.
    hook_bonus = 0.5 if body[:1].isupper() else 0.3
    engagement = round(min(1.0, hook_bonus + seo * 0.4 + readability * 0.2), 2)

    scores: dict[str, float | bool] = {
        "duplicate": duplicate,
        "toxicity": toxicity,
        "platformOk": platform_ok,
        "seo": seo,
        "readability": readability,
        "engagement": engagement,
    }

    passed = platform_ok and toxicity < 0.5
    return ValidationResult(passed=passed, scores=scores, issues=issues)
