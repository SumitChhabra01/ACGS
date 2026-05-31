"""CLI entrypoint invoked by GitHub Actions cron jobs (and locally for testing).

Usage:
  python run.py trends        # classify + score trends
  python run.py content       # trends -> content drafts (pending approval)
  python run.py analytics     # Instagram metrics -> growth recommendations
  python run.py ideas         # draft Reels ideas from your top-performing hooks
  python run.py ig-verify     # check the Instagram connection + discover account ID
  python run.py ig-sync       # fetch live IG media + insights (requires connection)
  python run.py ig-longtoken <SHORT_TOKEN>   # exchange for a ~60-day token

Runs entirely offline using mock LLM responses when no keys / local model are
present, so CI never burns tokens. Outputs a JSON summary to stdout.
"""
from __future__ import annotations

import json
import sys

from dotenv import load_dotenv

# Load .env BEFORE importing agents/config so env-driven settings (e.g.
# LLM_PROVIDER, model tiers) are read with the correct values at import time.
load_dotenv()

from agents.orchestrator import Orchestrator  # noqa: E402
from integrations import instagram as ig  # noqa: E402


def _ig_verify() -> dict:
    if not ig.is_configured():
        return {
            "connected": False,
            "reason": "META_ACCESS_TOKEN not set",
            "next_steps": "Follow docs/INSTAGRAM_SETUP.md, then set META_ACCESS_TOKEN in .env",
        }
    try:
        creds = ig.IgCredentials.from_env()
        info = ig.discover_ig_account(creds)
        return {"connected": True, **info}
    except ig.InstagramApiError as exc:
        return {"connected": False, "error": str(exc)}


def _ig_sync() -> dict:
    if not ig.is_configured():
        return {
            "error": "Instagram not connected. Run 'ig-verify' and see docs/INSTAGRAM_SETUP.md."
        }
    creds = ig.IgCredentials.from_env()
    account = ig.get_account(creds)
    media = ig.get_media(creds, limit=25, with_insights=True)
    return {
        "account": account,
        "media_count": len(media),
        "media": [m.__dict__ for m in media],
    }


def main(argv: list[str]) -> int:
    command = argv[1] if len(argv) > 1 else "trends"
    brand = "default"
    niche = "AI tools & autonomous workflows for builders"

    if command == "ig-longtoken":
        if len(argv) < 3:
            print(json.dumps({"error": "usage: python run.py ig-longtoken <SHORT_TOKEN>"}))
            return 2
        try:
            result = ig.exchange_long_lived_token(argv[2])
        except (ig.InstagramApiError, ig.InstagramNotConfigured) as exc:
            print(json.dumps({"error": str(exc)}))
            return 1
        print(json.dumps(result, indent=2, default=str))
        return 0

    if command == "ig-verify":
        print(json.dumps(_ig_verify(), indent=2, default=str))
        return 0
    if command == "ig-sync":
        try:
            print(json.dumps(_ig_sync(), indent=2, default=str))
        except ig.InstagramApiError as exc:
            print(json.dumps({"error": str(exc)}))
            return 1
        return 0

    orch = Orchestrator(brand_id=brand, niche=niche)
    try:
        result = orch.run_workflow(command)
    except ValueError as exc:
        print(json.dumps({"error": str(exc)}))
        return 2

    print(json.dumps(result, indent=2, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
