# AICOS Agent Layer (Python)

Event-driven, cost-disciplined content agents. Every model call goes through the
`ModelRouter`, which enforces tier routing, caching, and the budget guard.

## Layout
```
core/        model_router, budget_guard, cache, validation, rag, config, prompts
agents/      base, orchestrator, trend, content (more in later phases)
integrations/ llm (anthropic + ollama, with offline mock fallback)
tests/       offline smoke tests for the cost-control core
run.py       CLI entrypoint used by GitHub Actions cron
```

## Run locally
```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt

python run.py trends           # classify + score trends
python run.py content          # trends -> drafts (pending approval)
pytest -q                      # offline tests, no tokens burned
```

## Cost model
- `classification/tagging/summarization/...` → **local** (Ollama, free)
- `ideation/strategy/caption_cleanup` → **mid** (Claude Haiku)
- `final_content/viral_optimization/long_form` → **premium** (Claude Sonnet), gated by opportunity score
- Budget guard auto-downgrades at 85% of the daily limit and pauses low-priority work at 95%.

Without `ANTHROPIC_API_KEY` or a running Ollama, the LLM adapter returns deterministic
mock text so the full pipeline (and CI) runs with zero cost.
