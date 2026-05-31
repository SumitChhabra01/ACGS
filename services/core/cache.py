"""Cache layer: 'cache before regenerate'. In-memory fallback for local dev;
swap the backend for Upstash Redis in production by setting UPSTASH_REDIS_*.

Key = sha256(task_type + normalized_inputs + brand_id + tier). A hit short-circuits
any paid model call.
"""
from __future__ import annotations

import hashlib
import json
import time
from typing import Any


def cache_key(task_type: str, inputs: dict[str, Any], brand_id: str, tier: str) -> str:
    norm = json.dumps(inputs, sort_keys=True, separators=(",", ":"))
    raw = f"{task_type}|{brand_id}|{tier}|{norm}"
    return hashlib.sha256(raw.encode()).hexdigest()


class Cache:
    """Minimal interface; in-memory now, Redis-backed later (same methods)."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[float | None, Any]] = {}
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Any | None:
        item = self._store.get(key)
        if item is None:
            self.misses += 1
            return None
        expires_at, value = item
        if expires_at is not None and expires_at < time.time():
            del self._store[key]
            self.misses += 1
            return None
        self.hits += 1
        return value

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        expires_at = time.time() + ttl_seconds if ttl_seconds else None
        self._store[key] = (expires_at, value)

    @property
    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return self.hits / total if total else 0.0


# Process-wide instance (replace with Redis-backed instance in prod wiring).
cache = Cache()
