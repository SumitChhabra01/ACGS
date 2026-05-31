# AICOS — AI Autonomous Content Operating System

A lean, serverless, cost-disciplined AI content engine: research trends → strategize → generate (text + image) → human-approve → publish (Instagram + YouTube) → analyze → learn. Driven by event/cron-triggered agents, never an always-on AI loop.

> Full design rationale lives in [`docs/DESIGN.md`](./docs/DESIGN.md).

## Stack (MVP)

| Layer | Tech |
|---|---|
| Frontend + API | Next.js (App Router) on Vercel, Tailwind, shadcn-style UI |
| Agents | Python (model-tier routing, deterministic pipelines) |
| Scheduler | GitHub Actions cron |
| Data | Supabase Postgres + pgvector |
| Cache / Queue | Upstash Redis |
| Media | Cloudflare R2 |
| AI | Anthropic Claude (mid/premium) + local Ollama (cheap Tier-1) |

## Repository layout

```
apps/dashboard        Next.js admin command center (UI + API route handlers)
services              Python agent layer (core + agents + integrations)
packages/shared-types Shared TypeScript types
packages/config       Model-tier + budget + env config
packages/prompts       Centralized, versioned prompt templates
infrastructure/supabase  SQL migrations + RLS
.github/workflows     Scheduled + deploy automations
docs                  Design & architecture docs
```

## Getting started

### 1. Prerequisites
- Node.js >= 20, npm >= 10
- Python >= 3.11 (for the agent layer)
- (Optional) Ollama for local Tier-1 models

### 2. Environment
```bash
cp .env.example .env
# fill in values locally — NEVER commit .env
```

### 3. Install + run the dashboard
```bash
npm install
npm run dev
# http://localhost:3000
```

### 4. Python agents (later phases)
```bash
cd services
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

## Cost discipline (non-negotiable)
Every AI call routes through the model router + budget guard. Cheapest capable tier first (local → Haiku → Sonnet/Opus), cache before regenerate, retrieve before generate, validate before publish. Target: ~$100–500/month at MVP.

## Public dashboard (GitHub Pages)

After the **Deploy GitHub Pages** workflow runs on `main`:

**https://sumitchhabra01.github.io/ACGS/**

The site is static, but the UI loads **live data from Supabase** in the browser (no sample/demo data). Cron agents write to the same tables; **refresh the page** after a workflow finishes to see new trends, drafts, and analytics.

Setup: add GitHub secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, run migration `0003_public_read.sql`, then redeploy Pages. See **[docs/GITHUB_CRON.md](./docs/GITHUB_CRON.md)**.

Enable Pages once: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Hands-free agents (GitHub Actions cron)

Scheduled workflows run trends, content, analytics, and weekly Reels ideas in the cloud and write to Supabase. See **[docs/GITHUB_CRON.md](./docs/GITHUB_CRON.md)** for required secrets and schedules.

## Status
Phase 1 (Foundation) — in progress. See `docs/DESIGN.md` §14 for the phase plan.
