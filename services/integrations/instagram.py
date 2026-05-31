"""Instagram Graph API client (read-only: account, media, insights).

IMPORTANT: Instagram has NO API to read an account by @handle. You can only
access a Business/Creator account that YOU own/manage, using a Meta app access
token + the account's IG Business Account ID. See docs/INSTAGRAM_SETUP.md.

This module is offline-safe: when META_ACCESS_TOKEN / IG_BUSINESS_ACCOUNT_ID are
not set, every call raises InstagramNotConfigured so callers can fall back to a
clear "connect your account" state instead of crashing a cron job.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

import httpx

GRAPH_VERSION = "v21.0"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_VERSION}"

# Metrics differ by media product type. NOTE: `impressions` and `plays` were
# deprecated by Meta on 2025-04-21 — use `views` instead (FEED/STORY/REELS).
MEDIA_METRICS = {
    "REELS": "reach,saved,likes,comments,shares,total_interactions,views",
    "FEED": "reach,saved,likes,comments,shares,total_interactions,views",
    "STORY": "reach,replies,views",
}
ACCOUNT_METRICS = "reach,follower_count"


class InstagramNotConfigured(RuntimeError):
    pass


class InstagramApiError(RuntimeError):
    pass


@dataclass
class IgCredentials:
    access_token: str
    ig_user_id: str | None = None  # IG Business Account ID

    @classmethod
    def from_env(cls) -> IgCredentials:
        token = os.environ.get("META_ACCESS_TOKEN")
        if not token:
            raise InstagramNotConfigured(
                "META_ACCESS_TOKEN is not set. See docs/INSTAGRAM_SETUP.md."
            )
        return cls(access_token=token, ig_user_id=os.environ.get("IG_BUSINESS_ACCOUNT_ID"))


@dataclass
class MediaItem:
    id: str
    caption: str
    media_type: str
    media_product_type: str
    permalink: str
    timestamp: str
    like_count: int
    comments_count: int
    insights: dict[str, int] = field(default_factory=dict)


def is_configured() -> bool:
    return bool(os.environ.get("META_ACCESS_TOKEN"))


def _get(path: str, params: dict[str, Any]) -> dict[str, Any]:
    try:
        resp = httpx.get(f"{GRAPH_BASE}/{path}", params=params, timeout=30)
    except httpx.HTTPError as exc:  # network error
        raise InstagramApiError(f"network error: {exc}") from exc
    if resp.status_code >= 400:
        # Surface Meta's structured error to make debugging tokens/permissions easy.
        try:
            err = resp.json().get("error", {})
            raise InstagramApiError(
                f"{err.get('type', 'GraphError')}: {err.get('message', resp.text)} "
                f"(code {err.get('code')})"
            )
        except ValueError:
            raise InstagramApiError(f"HTTP {resp.status_code}: {resp.text}") from None
    return resp.json()


def exchange_long_lived_token(short_token: str) -> dict[str, Any]:
    """Exchange a ~1h short-lived token for a ~60-day long-lived token.

    Requires META_APP_ID + META_APP_SECRET in the environment. Returns the raw
    Graph response containing access_token + expires_in.
    """
    app_id = os.environ.get("META_APP_ID")
    app_secret = os.environ.get("META_APP_SECRET")
    if not (app_id and app_secret):
        raise InstagramNotConfigured(
            "META_APP_ID and META_APP_SECRET must be set to exchange for a long-lived token."
        )
    return _get(
        "oauth/access_token",
        {
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": short_token,
        },
    )


def discover_ig_account(creds: IgCredentials) -> dict[str, str]:
    """Resolve the IG Business Account ID from the token's linked Facebook Pages.

    Saves the user from hunting for the ID manually. Returns {page, ig_user_id,
    username} for the first page that has a linked IG business account.
    """
    pages = _get("me/accounts", {"access_token": creds.access_token, "fields": "name,id"})
    for page in pages.get("data", []):
        detail = _get(
            page["id"],
            {
                "access_token": creds.access_token,
                "fields": "instagram_business_account{id,username}",
            },
        )
        iba = detail.get("instagram_business_account")
        if iba:
            return {
                "page": page.get("name", ""),
                "ig_user_id": iba["id"],
                "username": iba.get("username", ""),
            }
    raise InstagramApiError(
        "No Instagram Business Account linked to any Page on this token. "
        "Convert the IG account to Business/Creator and link it to a Facebook Page."
    )


def get_account(creds: IgCredentials) -> dict[str, Any]:
    ig_id = _require_ig_id(creds)
    return _get(
        ig_id,
        {
            "access_token": creds.access_token,
            "fields": "username,name,followers_count,follows_count,media_count,biography",
        },
    )


def get_media(creds: IgCredentials, limit: int = 25, with_insights: bool = True) -> list[MediaItem]:
    ig_id = _require_ig_id(creds)
    data = _get(
        f"{ig_id}/media",
        {
            "access_token": creds.access_token,
            "limit": limit,
            "fields": (
                "id,caption,media_type,media_product_type,permalink,timestamp,"
                "like_count,comments_count"
            ),
        },
    )
    items: list[MediaItem] = []
    for m in data.get("data", []):
        item = MediaItem(
            id=m["id"],
            caption=m.get("caption", ""),
            media_type=m.get("media_type", ""),
            media_product_type=m.get("media_product_type", "FEED"),
            permalink=m.get("permalink", ""),
            timestamp=m.get("timestamp", ""),
            like_count=int(m.get("like_count", 0)),
            comments_count=int(m.get("comments_count", 0)),
        )
        if with_insights:
            try:
                item.insights = get_media_insights(creds, item.id, item.media_product_type)
            except InstagramApiError:
                item.insights = {}
        items.append(item)
    return items


def get_media_insights(creds: IgCredentials, media_id: str, product_type: str) -> dict[str, int]:
    metric = MEDIA_METRICS.get(product_type.upper(), MEDIA_METRICS["FEED"])
    data = _get(
        f"{media_id}/insights",
        {"access_token": creds.access_token, "metric": metric},
    )
    out: dict[str, int] = {}
    for row in data.get("data", []):
        values = row.get("values", [])
        if values:
            out[row["name"]] = int(values[0].get("value", 0))
    return out


def get_account_insights(creds: IgCredentials, period: str = "day") -> dict[str, int]:
    ig_id = _require_ig_id(creds)
    data = _get(
        f"{ig_id}/insights",
        {"access_token": creds.access_token, "metric": ACCOUNT_METRICS, "period": period},
    )
    out: dict[str, int] = {}
    for row in data.get("data", []):
        values = row.get("values", [])
        if values:
            out[row["name"]] = int(values[-1].get("value", 0))
    return out


def _require_ig_id(creds: IgCredentials) -> str:
    if creds.ig_user_id:
        return creds.ig_user_id
    discovered = discover_ig_account(creds)
    creds.ig_user_id = discovered["ig_user_id"]
    return creds.ig_user_id
