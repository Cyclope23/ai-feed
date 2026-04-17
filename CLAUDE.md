# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server on :3000
npm run build        # prisma generate && next build
npm test             # vitest run (all unit tests)
npm test -- <name>   # run single test file (e.g. npm test -- ranking-engine)
npm run test:watch   # vitest watch mode
npm run test:e2e     # playwright E2E tests
npm run lint         # next lint

# Database
npm run db:push      # sync prisma schema to DB (no migration files)
npm run db:migrate   # create and apply migration
npm run db:seed      # seed admin user + 8 RSS/GitHub sources
npm run db:studio    # prisma studio GUI
```

Prisma reads from `.env` (not `.env.local`). Copy your DATABASE_URL there for local CLI usage.

## Architecture

**3-step cron pipeline** (triggered every 6h via GitHub Actions, staggered 5min apart):

1. `/api/cron/fetch` → FeedFetcher (RSS) + GitHubScanner (Octokit) → upsert FeedItems + classify type
2. `/api/cron/rank` → RankingEngine scores all items from last 30 days → DailyRanking (in transaction)
3. `/api/cron/enrich` → AIEnricher calls Claude API (claude-sonnet-4-6) for 20 items/batch → AIEnrichment

Pipeline coordination: each step writes to `PipelineStatus` table; next step checks previous step completed for today's date before running.

**Scoring formula** (lib/services/ranking-engine.ts):
- Novelty 30%: linear decay 100→0 over 30 days
- Popularity 40%: sqrt scale of (stars×1.5 + forks×3 + mentions×5), ceiling 200000
- Relevance 30%: keyword matching, title worth 2× content

**GitHub sources**: topic-based (`topic:claude`, `topic:mcp`, `topic:claude-code`) plus text-search based (`claude-code in:name,description,readme`, `claude plugin in:name,description`, etc.) for broader coverage.

**Study Guide generation**: on-demand per item via `/api/item/[slug]/study`. Uses Claude API to generate comprehensive markdown learning guide (installation, config, code examples, workflow integration, tips). Cached in `StudyGuide` table after first generation.

**Auth split** (NextAuth v5 edge-safe pattern):
- `auth.config.ts` — edge-safe config (imported by middleware.ts, runs in Edge Runtime)
- `lib/auth.ts` — full config with Credentials provider + Prisma + bcrypt (Node runtime only)
- Never import `lib/auth.ts` from middleware — Prisma/bcrypt cannot run in Edge

**Cron auth**: Bearer token via `CRON_SECRET` env var, validated in `app/api/cron/_auth.ts`.

**Admin API auth**: `/api/admin/*` routes use NextAuth session checks. Middleware matcher covers both `/admin/:path*` and `/api/admin/:path*`.

**Admin panel** (`/admin`): Interactive client-side dashboard with:
- Stats overview (total items, ranked today, enriched, pending/failed)
- Pipeline controls (trigger fetch/rank/enrich individually)
- Source management (add/toggle/delete sources)

## Pages & Routes

- `/` — Homepage with ranking list, type filters, AI Enriched filter, search, pagination (20/page)
- `/item/[slug]` — Item detail with score cards, enrichment content, workflow box, study guide, quick start
- `/ranking/[date]` — Historical daily ranking
- `/admin` — Admin dashboard (requires auth)
- `/admin/login` — Login page
- `/api/cron/{fetch,rank,enrich}` — Pipeline endpoints (CRON_SECRET auth)
- `/api/admin/{stats,pipeline,sources,sources/[id],refresh}` — Admin API (session auth)
- `/api/item/[slug]/study` — Study guide generation (GET to check, POST to generate)

## Key Patterns

- Path alias `@/*` maps to project root
- All DB-dependent pages use `export const dynamic = 'force-dynamic'` (prevents prerender errors on Vercel)
- Services in `lib/services/` are pure/isolated — tested via Vitest with mocked dependencies
- Tests colocated in `__tests__/` directories adjacent to source
- Vitest uses `globals: true` — no need to import describe/it/expect
- AI enrichment prompts are in Italian — all generated content (summary, practicalDescription, useCase) must be in Italian
- Study guide prompts are in Italian with code examples in English
- Slug collision handling: appends URL suffix when titles collide
- AI JSON responses: strip markdown fences before parsing (Claude sometimes wraps in ```json)
- Study guide uses upsert to prevent race conditions on concurrent requests

## Env Vars

`DATABASE_URL`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `CRON_SECRET`

## Deploy

Vercel Hobby plan. Cron jobs run via GitHub Actions (`.github/workflows/cron-pipeline.yml`) since Hobby only allows 1 daily cron. GitHub Actions secrets needed: `CRON_SECRET`, `APP_URL`.

Production URL: https://ai-feed-sigma.vercel.app
Repo: https://github.com/Cyclope23/ai-feed
