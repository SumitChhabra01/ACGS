"""Prompt templates — Python mirror of packages/prompts (TS). Keep small and
reusable; inject only retrieved context, never raw history.
"""
from __future__ import annotations

PROMPTS: dict[str, str] = {
    "trend_classify": (
        "You classify content trends for the brand niche: {niche}.\n"
        "Given the trend item below, return STRICT JSON with keys:\n"
        "topic (string), viral_score (0-100), opportunity_score (0-100), reason (short).\n"
        "Trend item: {item}"
    ),
    "strategy_generate": (
        "Brand: {brand_name} | Niche: {niche} | Voice: {voice}\n"
        "Platform: {platform}.\n"
        "Top trends (JSON): {trends}\n"
        "Produce STRICT JSON: {{ angle, hooks[3], hashtags[8], format }}.\n"
        "Keep it specific, on-brand, and platform-appropriate."
    ),
    "content_outline": (
        "Create a tight outline for a {platform} {content_type}.\n"
        "Strategy: {strategy}\n"
        "Retrieved similar successful posts (for structure reuse): {rag}\n"
        "Return STRICT JSON: {{ hook, beats[], cta }}."
    ),
    "content_generate": (
        "Brand voice: {voice}. Platform: {platform}. Type: {content_type}.\n"
        "Outline: {outline}\n"
        "Constraints: {constraints}\n"
        "Write the final {content_type}. Output ONLY the content text."
    ),
    "content_optimize": (
        "Improve the hook strength and shareability of this {platform} content\n"
        "WITHOUT changing its factual claims or going off-brand.\n"
        "Content: {content}\n"
        "Return ONLY the improved content text."
    ),
}


def render(key: str, **vars: str) -> str:
    return PROMPTS[key].format(**vars)
