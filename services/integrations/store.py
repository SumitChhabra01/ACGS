"""Supabase persistence for agent output (content, trends, usage, analytics).

Best-effort and offline-safe: when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
not set (local dev / CI), every function is a no-op so agents keep working and
the pipeline still prints results. When configured, agent results are written to
the same tables the dashboard reads from — closing the loop into "live mode".
"""
from __future__ import annotations

import os
from typing import Any

_client = None
_brand_id: str | None = None
_brand_resolved = False


def is_configured() -> bool:
    return bool(
        (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
        and os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not is_configured():
        return None
    try:
        from supabase import create_client

        url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        _client = create_client(url, key)
        return _client
    except Exception:  # noqa: BLE001 - never let persistence break a run
        return None


def _resolve_brand_id(client) -> str | None:
    """Use SUPABASE_BRAND_ID if set, else the first brand profile, else None."""
    global _brand_id, _brand_resolved
    if _brand_resolved:
        return _brand_id
    _brand_resolved = True
    env_id = os.getenv("SUPABASE_BRAND_ID")
    if env_id:
        _brand_id = env_id
        return _brand_id
    try:
        res = client.table("brand_profiles").select("id").limit(1).execute()
        rows = res.data or []
        _brand_id = rows[0]["id"] if rows else None
    except Exception:  # noqa: BLE001
        _brand_id = None
    return _brand_id


def record_usage(
    *,
    agent: str,
    model_tier: str,
    input_tokens: int,
    output_tokens: int,
    cost: float,
    workflow: str | None = None,
    platform: str | None = None,
) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        client.table("ai_usage").insert(
            {
                "agent": agent,
                "workflow": workflow,
                "platform": platform,
                "model_tier": model_tier,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost_estimate": round(cost, 5),
            }
        ).execute()
    except Exception:  # noqa: BLE001
        pass


def save_content_items(drafts: list[dict[str, Any]]) -> int:
    """Persist content-agent drafts into content_items. Returns rows written."""
    client = _get_client()
    if client is None or not drafts:
        return 0
    brand_id = _resolve_brand_id(client)
    rows = []
    for d in drafts:
        rows.append(
            {
                "brand_id": brand_id,
                "platform": d.get("platform", "instagram"),
                "type": d.get("type", "instagram_caption"),
                "body": d.get("body", ""),
                "quality_scores": d.get("quality_scores"),
                "metadata": {
                    "tier_used": d.get("tier_used"),
                    "optimized": d.get("optimized", False),
                    "issues": d.get("issues", []),
                },
                "status": d.get("status", "pending_approval"),
            }
        )
    try:
        client.table("content_items").insert(rows).execute()
        return len(rows)
    except Exception:  # noqa: BLE001
        return 0


def save_trends(trends: list[dict[str, Any]]) -> int:
    client = _get_client()
    if client is None or not trends:
        return 0
    brand_id = _resolve_brand_id(client)
    rows = [
        {
            "brand_id": brand_id,
            "source": t.get("source", "unknown"),
            "topic": t.get("topic", ""),
            "viral_score": int(t.get("viral_score", 0)),
            "opportunity_score": int(t.get("opportunity_score", 0)),
            "raw": {"tier": t.get("tier"), "cached": t.get("cached", False)},
        }
        for t in trends
    ]
    try:
        client.table("trends").insert(rows).execute()
        return len(rows)
    except Exception:  # noqa: BLE001
        return 0
