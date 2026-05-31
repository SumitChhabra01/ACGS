# GitHub Actions cron (hands-free agents)

Scheduled workflows write results to **Supabase**. Your **local dashboard** (`npm run dev`) reads the same tables — refresh the app to see new trends, drafts, and spend.

GitHub Pages (`https://sumitchhabra01.github.io/ACGS/`) stays a **static demo** and does not run these jobs.

## Schedules

| Workflow | Cron (UTC) | Command | What it does |
|----------|------------|---------|----------------|
| Agents — Analytics | Daily 03:00 | `analytics` | IG metrics + growth tips → `audit_logs` |
| Agents — Trends | Every 2h at :15 | `trends` | Score trends → `trends` |
| Agents — Content | Every 6h at :30 | `content` | Drafts → `content_items` |
| Agents — Reels ideas | Mon 06:00 | `ideas` | Reels scripts from top hooks → `content_items` |

**Manual run:** [Actions](https://github.com/SumitChhabra01/ACGS/actions) → pick a workflow → **Run workflow**.

> GitHub may delay cron by 5–15 minutes on free tiers. `workflow_dispatch` is instant.

## Required repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Required for | Value |
|--------|----------------|-------|
| `SUPABASE_URL` | All agents | `https://lwpuamcantjhegjxhzbx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | All agents | Your `sb_secret_...` key |
| `META_ACCESS_TOKEN` | Analytics, Ideas | Long-lived token (~60 days) |
| `IG_BUSINESS_ACCOUNT_ID` | Optional | `17841479936125243` (auto-discovered if omitted) |
| `ANTHROPIC_API_KEY` | Content, Trends, Ideas | Claude key (needs credits) |
| `BRAND_NICHE` | Optional | e.g. `cinematic travel storytelling for @cineai_diaries` |

**Do not set** `LLM_PROVIDER=ollama` in GitHub — Ollama only runs on your PC.

## What runs without Anthropic credits

| Workflow | Runs? | Saves to DB? |
|----------|-------|----------------|
| Analytics | Yes (needs Meta token) | Yes (`audit_logs`) |
| Trends | Yes | Yes (stub scores if no Claude) |
| Content | Yes | Only **real** drafts (mocks skipped) |
| Ideas | Yes | Only **real** drafts (mocks skipped) |

Add Anthropic credits at [console.anthropic.com](https://console.anthropic.com) for real AI-written captions and Reels.

## Token refresh reminder

`META_ACCESS_TOKEN` expires about every **60 days**. When analytics fails with code 190, generate a new short token in [Graph API Explorer](https://developers.facebook.com/tools/explorer/), run locally:

```bash
cd services
python run.py ig-longtoken <SHORT_TOKEN>
```

Update the GitHub secret `META_ACCESS_TOKEN` with the new long-lived value.

## Verify after setup

1. Actions → **Agents — Analytics** → **Run workflow**
2. Green check → open local dashboard → Command Center / Content should show new data after refresh
3. Supabase → Table Editor → `ai_usage`, `trends`, `content_items`, `audit_logs`
