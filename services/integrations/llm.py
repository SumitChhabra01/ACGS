"""LLM provider adapters with offline-safe fallbacks.

- Anthropic (mid/premium) via the official SDK when ANTHROPIC_API_KEY is set.
- Ollama (local Tier-1) via its HTTP API when reachable.
- Otherwise a deterministic MOCK response so the whole pipeline runs in CI / dev
  without network or keys. Each adapter returns (text, input_tokens, output_tokens).
"""
from __future__ import annotations

import os
import re

import httpx

from core.config import TierModel

# Reasoning models (e.g. deepseek-r1) wrap their chain-of-thought in <think>
# tags; strip it so only the final answer is stored as content.
_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)


def _approx_tokens(text: str) -> int:
    # Rough heuristic good enough for cost estimation in the MVP.
    return max(1, len(text) // 4)


def call_anthropic(model: TierModel, prompt: str, max_tokens: int = 800) -> tuple[str, int, int]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return _mock(model, prompt)
    try:
        import anthropic  # imported lazily so the package is optional in dev

        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model=model.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(
            block.text for block in msg.content if getattr(block, "type", None) == "text"
        )
        usage = getattr(msg, "usage", None)
        in_tok = getattr(usage, "input_tokens", _approx_tokens(prompt))
        out_tok = getattr(usage, "output_tokens", _approx_tokens(text))
        return text, in_tok, out_tok
    except Exception as exc:  # noqa: BLE001 - fall back rather than crash a cron job
        return f"[anthropic-error:{exc}] " + _mock(model, prompt)[0], _approx_tokens(prompt), 0


def call_ollama(model: TierModel, prompt: str) -> tuple[str, int, int]:
    base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    try:
        resp = httpx.post(
            f"{base}/api/generate",
            json={"model": model.model, "prompt": prompt, "stream": False},
            timeout=180,  # local CPU generation can be slow for longer outputs
        )
        resp.raise_for_status()
        text = resp.json().get("response", "")
        text = _THINK_RE.sub("", text).strip()
        return text, _approx_tokens(prompt), _approx_tokens(text)
    except Exception:  # noqa: BLE001 - local model not running -> mock
        return _mock(model, prompt)


def _mock(model: TierModel, prompt: str) -> tuple[str, int, int]:
    text = (
        f"[MOCK:{model.tier.value}] Deterministic stub for offline/dev runs. "
        f"Prompt head: {prompt.strip()[:80]}"
    )
    return text, _approx_tokens(prompt), _approx_tokens(text)
