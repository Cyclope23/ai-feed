# AI Feeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire una web app Next.js che aggrega feed RSS e GitHub sull'ecosistema Claude, calcola un ranking giornaliero e arricchisce ogni item con descrizione AI e use case.

**Architecture:** Monolite Next.js 15 (App Router) su Vercel Pro, con pipeline a 3 cron job sfalsati (fetch → rank → enrich) coordinati via DB. PostgreSQL Neon con Prisma ORM. Frontend dashboard a 2 colonne con SSR/ISR.

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL (Neon), Tailwind CSS, shadcn/ui, NextAuth.js, Anthropic SDK (claude-sonnet-4-6), Octokit, Recharts, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-04-15-ai-feeds-design.md`

---

## File Structure

### Configurazione e setup
- `package.json` — dipendenze e script
- `tsconfig.json` — TypeScript config
- `next.config.ts` — Next.js config
- `tailwind.config.ts` — Tailwind theme
- `vercel.json` — cron schedules
- `.env.example` — template env vars
- `prisma/schema.prisma` — schema DB
- `prisma/seed.ts` — seed iniziale (admin + fonti)

### Core lib (servizi puri, testabili)
- `lib/db.ts` — singleton Prisma client
- `lib/anthropic.ts` — singleton Anthropic client
- `lib/github.ts` — singleton Octokit client
- `lib/services/feed-fetcher.ts` — parsing RSS/Atom
- `lib/services/github-scanner.ts` — ricerca repo GitHub
- `lib/services/item-classifier.ts` — classificazione tipo item
- `lib/services/ranking-engine.ts` — calcolo score
- `lib/services/ai-enricher.ts` — chiamate Claude API
- `lib/services/pipeline-status.ts` — coordinamento step pipeline
- `lib/utils/date.ts` — helper date UTC
- `lib/utils/slug.ts` — slug da titolo
- `lib/auth.ts` — config NextAuth

### API routes
- `app/api/cron/fetch/route.ts` — Step 1 cron
- `app/api/cron/rank/route.ts` — Step 2 cron
- `app/api/cron/enrich/route.ts` — Step 3 cron
- `app/api/items/route.ts` — list API pubblica
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `app/api/admin/sources/route.ts` — CRUD fonti (admin)
- `app/api/admin/refresh/route.ts` — trigger manuale (admin)

### UI / Pages
- `app/layout.tsx` — root layout
- `app/page.tsx` — dashboard
- `app/item/[slug]/page.tsx` — dettaglio item
- `app/ranking/[date]/page.tsx` — storico ranking
- `app/admin/page.tsx` — pannello admin
- `app/admin/login/page.tsx` — login admin
- `components/ui/*` — shadcn components
- `components/RankingList.tsx` — colonna sinistra dashboard
- `components/RecentFeed.tsx` — colonna destra dashboard
- `components/CategoryFilter.tsx` — filtri tipo
- `components/ItemHeader.tsx` — header pagina dettaglio
- `components/ScoreBreakdown.tsx` — breakdown score
- `components/ScoreHistoryChart.tsx` — chart storico (Recharts)

### Test
- `lib/services/__tests__/*.test.ts` — unit test servizi
- `lib/utils/__tests__/*.test.ts` — unit test utility
- `app/api/__tests__/*.test.ts` — integration test API
- `e2e/dashboard.spec.ts` — E2E Playwright

---

## Task 1: Bootstrap progetto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `README.md`

- [ ] **Step 1: Inizializzare git repo**

```bash
cd "C:\Users\danie\github\ai-feeds"
git init
git branch -M main
```

- [ ] **Step 2: Creare package.json**

```json
{
  "name": "ai-feeds",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^6.0.0",
    "@anthropic-ai/sdk": "^0.40.0",
    "@octokit/rest": "^21.0.0",
    "next-auth": "^5.0.0-beta.20",
    "bcryptjs": "^2.4.3",
    "rss-parser": "^3.13.0",
    "recharts": "^2.13.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "prisma": "^6.0.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "@playwright/test": "^1.48.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

- [ ] **Step 3: Installare dipendenze**

Run: `npm install`
Expected: SUCCESS, crea `node_modules/` e `package-lock.json`

- [ ] **Step 4: Creare tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Creare file di configurazione e layout base**

`next.config.ts`:
```typescript
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {};
export default nextConfig;
```

`tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

`postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body { font-family: system-ui, -apple-system, sans-serif; }
```

`app/layout.tsx`:
```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Feeds',
  description: 'Le novità dell\'ecosistema Claude classificate ogni giorno',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

`app/page.tsx`:
```tsx
export default function Page() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">⚡ AI Feeds</h1>
      <p className="text-zinc-500">Coming soon</p>
    </main>
  );
}
```

`.gitignore`:
```
node_modules/
.next/
.env
.env.local
.superpowers/
*.log
.vercel
playwright-report/
test-results/
```

- [ ] **Step 6: Verificare build**

Run: `npm run build`
Expected: Build successful, no TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: bootstrap Next.js 15 project with Tailwind and TypeScript"
```

---

## Task 2: Setup Vitest e prima utility con TDD

**Files:**
- Create: `vitest.config.ts`, `lib/utils/date.ts`, `lib/utils/__tests__/date.test.ts`, `lib/utils/slug.ts`, `lib/utils/__tests__/slug.test.ts`

- [ ] **Step 1: Creare vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
});
```

- [ ] **Step 2: Scrivere test fallente per `dateUtcString`**

`lib/utils/__tests__/date.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { dateUtcString, isToday } from '../date';

describe('dateUtcString', () => {
  it('returns YYYY-MM-DD format in UTC', () => {
    const d = new Date('2026-04-16T15:30:00Z');
    expect(dateUtcString(d)).toBe('2026-04-16');
  });

  it('handles dates near UTC midnight correctly', () => {
    const d = new Date('2026-04-16T23:59:59Z');
    expect(dateUtcString(d)).toBe('2026-04-16');
  });
});

describe('isToday', () => {
  it('returns true if date is today UTC', () => {
    const today = new Date();
    expect(isToday(dateUtcString(today))).toBe(true);
  });

  it('returns false for yesterday', () => {
    expect(isToday('2020-01-01')).toBe(false);
  });
});
```

- [ ] **Step 3: Run test, verificare fallimento**

Run: `npm test -- date.test`
Expected: FAIL — module not found

- [ ] **Step 4: Implementare `lib/utils/date.ts`**

```typescript
export function dateUtcString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function isToday(dateStr: string): boolean {
  return dateStr === dateUtcString(new Date());
}
```

- [ ] **Step 5: Verificare passaggio**

Run: `npm test -- date.test`
Expected: PASS

- [ ] **Step 6: Test fallente per `slugify`**

`lib/utils/__tests__/slug.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { slugify } from '../slug';

describe('slugify', () => {
  it('converts title to URL-safe slug', () => {
    expect(slugify('Claude MCP Server v2.0')).toBe('claude-mcp-server-v2-0');
  });
  it('handles special characters', () => {
    expect(slugify('Hello, World! & friends')).toBe('hello-world-friends');
  });
  it('truncates at 80 chars', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });
});
```

- [ ] **Step 7: Implementare `lib/utils/slug.ts`**

```typescript
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
```

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts lib/utils/
git commit -m "feat: add date and slug utilities with tests"
```

---

## Task 3: Schema Prisma e setup DB

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`, `.env.example`

- [ ] **Step 1: Creare `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SourceType {
  RSS
  GITHUB
}

enum ItemType {
  NEWS
  PLUGIN
  SKILL
  FRAMEWORK
}

enum PipelineStep {
  FETCH
  RANK
  ENRICH
}

enum EnrichmentStatus {
  PENDING
  COMPLETED
  FAILED
}

model Source {
  id                  String     @id @default(cuid())
  name                String
  type                SourceType
  url                 String     @unique
  category            String?
  isActive            Boolean    @default(true)
  lastFetchedAt       DateTime?
  fetchIntervalHours  Int        @default(6)
  createdAt           DateTime   @default(now())
  items               FeedItem[]
}

model FeedItem {
  id            String         @id @default(cuid())
  sourceId     String
  source        Source         @relation(fields: [sourceId], references: [id])
  title         String
  slug          String         @unique
  url           String         @unique
  description   String?
  content       String?
  publishedAt   DateTime
  type          ItemType       @default(NEWS)
  githubStars   Int?
  githubForks   Int?
  mentionCount  Int            @default(1)
  imageUrl      String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  rankings      DailyRanking[]
  enrichment    AIEnrichment?

  @@index([publishedAt])
  @@index([type])
}

model DailyRanking {
  id              String   @id @default(cuid())
  feedItemId      String
  feedItem        FeedItem @relation(fields: [feedItemId], references: [id])
  date            String   // YYYY-MM-DD UTC
  noveltyScore    Float
  popularityScore Float
  relevanceScore  Float
  totalScore      Float
  rank            Int

  @@unique([feedItemId, date])
  @@index([date, rank])
}

model AIEnrichment {
  id                   String           @id @default(cuid())
  feedItemId           String           @unique
  feedItem             FeedItem         @relation(fields: [feedItemId], references: [id])
  summary              String           @default("")
  practicalDescription String           @default("")
  useCase              String           @default("")
  generatedAt          DateTime?
  model                String           @default("")
  retryCount           Int              @default(0)
  status               EnrichmentStatus @default(PENDING)
}

model PipelineStatus {
  id          String       @id @default(cuid())
  step        PipelineStep
  date        String       // YYYY-MM-DD UTC
  completedAt DateTime     @default(now())

  @@unique([step, date])
}

model AdminUser {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 2: Creare `.env.example`**

```
DATABASE_URL="postgresql://user:pass@host/db"
ANTHROPIC_API_KEY="sk-ant-..."
GITHUB_TOKEN="ghp_..."
# NextAuth v5 — usa AUTH_* (non NEXTAUTH_*)
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_TRUST_HOST="true"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD_HASH="$2a$10$..."
CRON_SECRET="generate-random-string"
```

- [ ] **Step 3: Creare `lib/db.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

- [ ] **Step 4: Generare client Prisma**

Run: `npx prisma generate`
Expected: Client generated successfully

- [ ] **Step 5: Verificare TypeScript**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma lib/db.ts .env.example
git commit -m "feat: add Prisma schema and DB client"
```

---

## Task 4: ItemClassifier (TDD)

**Files:**
- Create: `lib/services/item-classifier.ts`, `lib/services/__tests__/item-classifier.test.ts`

- [ ] **Step 1: Test fallente**

`lib/services/__tests__/item-classifier.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { classifyItem } from '../item-classifier';

describe('classifyItem', () => {
  it('classifies GitHub repo with "plugin" topic as PLUGIN', () => {
    expect(classifyItem({
      sourceType: 'GITHUB',
      title: 'awesome-tool',
      description: 'A claude plugin for X',
      topics: ['claude', 'plugin'],
    })).toBe('PLUGIN');
  });

  it('classifies GitHub repo with "framework" keyword as FRAMEWORK', () => {
    expect(classifyItem({
      sourceType: 'GITHUB',
      title: 'claude-sdk',
      description: 'TypeScript SDK for Claude',
      topics: ['claude', 'sdk'],
    })).toBe('FRAMEWORK');
  });

  it('defaults GitHub repo without specific keywords to PLUGIN', () => {
    expect(classifyItem({
      sourceType: 'GITHUB',
      title: 'random-claude-tool',
      description: 'Some tool',
      topics: ['claude'],
    })).toBe('PLUGIN');
  });

  it('classifies RSS item with "skill" in title as SKILL', () => {
    expect(classifyItem({
      sourceType: 'RSS',
      title: 'New Claude skill for X',
      description: '...',
    })).toBe('SKILL');
  });

  it('defaults RSS items to NEWS', () => {
    expect(classifyItem({
      sourceType: 'RSS',
      title: 'Anthropic announces new model',
      description: '...',
    })).toBe('NEWS');
  });
});
```

- [ ] **Step 2: Run test, FAIL**

Run: `npm test -- item-classifier`

- [ ] **Step 3: Implementare `lib/services/item-classifier.ts`**

```typescript
import type { ItemType, SourceType } from '@prisma/client';

interface ClassifyInput {
  sourceType: SourceType;
  title: string;
  description?: string | null;
  topics?: string[];
}

const FRAMEWORK_KEYWORDS = ['framework', 'sdk', 'library'];
const SKILL_KEYWORDS = ['skill'];
const PLUGIN_KEYWORDS = ['plugin', 'mcp'];

export function classifyItem(input: ClassifyInput): ItemType {
  const haystack = [
    input.title,
    input.description ?? '',
    ...(input.topics ?? []),
  ].join(' ').toLowerCase();

  const has = (kws: string[]) => kws.some(k => haystack.includes(k));

  if (input.sourceType === 'GITHUB') {
    if (has(FRAMEWORK_KEYWORDS)) return 'FRAMEWORK';
    if (has(SKILL_KEYWORDS)) return 'SKILL';
    return 'PLUGIN';
  }

  if (has(FRAMEWORK_KEYWORDS)) return 'FRAMEWORK';
  if (has(SKILL_KEYWORDS)) return 'SKILL';
  if (has(PLUGIN_KEYWORDS)) return 'PLUGIN';
  return 'NEWS';
}
```

- [ ] **Step 4: Run, PASS**

Run: `npm test -- item-classifier`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/item-classifier.ts lib/services/__tests__/item-classifier.test.ts
git commit -m "feat: add ItemClassifier service"
```

---

## Task 5: RankingEngine (TDD)

**Files:**
- Create: `lib/services/ranking-engine.ts`, `lib/services/__tests__/ranking-engine.test.ts`

- [ ] **Step 1: Test fallente per i 3 score**

`lib/services/__tests__/ranking-engine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { noveltyScore, popularityScore, relevanceScore, totalScore } from '../ranking-engine';

describe('noveltyScore', () => {
  it('returns ~100 for items published now', () => {
    expect(noveltyScore(new Date())).toBeGreaterThan(99);
  });
  it('returns 0 for items older than threshold', () => {
    const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // 30d ago
    expect(noveltyScore(old)).toBe(0);
  });
  it('decays linearly', () => {
    const halfWay = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // 7d
    const score = noveltyScore(halfWay);
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThan(80);
  });
});

describe('popularityScore', () => {
  it('returns 0 for no signals', () => {
    expect(popularityScore({ stars: 0, forks: 0, mentions: 0 })).toBe(0);
  });
  it('caps at 100 for very popular items', () => {
    expect(popularityScore({ stars: 100000, forks: 5000, mentions: 50 })).toBe(100);
  });
  it('weights mentions higher than stars per unit', () => {
    const a = popularityScore({ stars: 10, forks: 0, mentions: 0 });
    const b = popularityScore({ stars: 0, forks: 0, mentions: 10 });
    expect(b).toBeGreaterThan(a);
  });
});

describe('relevanceScore', () => {
  it('rewards keyword matches in title 2x vs content', () => {
    const a = relevanceScore({ title: 'Claude MCP', content: 'random text' });
    const b = relevanceScore({ title: 'Random text', content: 'Claude MCP' });
    expect(a).toBeGreaterThan(b);
  });
  it('returns 0 for no matches', () => {
    expect(relevanceScore({ title: 'Random', content: 'Stuff' })).toBe(0);
  });
});

describe('totalScore', () => {
  it('weights 40/30/30', () => {
    expect(totalScore({ novelty: 100, popularity: 0, relevance: 0 })).toBeCloseTo(40);
    expect(totalScore({ novelty: 0, popularity: 100, relevance: 0 })).toBeCloseTo(30);
    expect(totalScore({ novelty: 0, popularity: 0, relevance: 100 })).toBeCloseTo(30);
  });
});
```

- [ ] **Step 2: Run, FAIL**

Run: `npm test -- ranking-engine`

- [ ] **Step 3: Implementare `lib/services/ranking-engine.ts`**

```typescript
// Linear decay: 100 at age=0, 0 at age=720h (30d)
const NOVELTY_MAX_AGE_HOURS = 720;
const POP_CEILING = 50000;
const KEYWORDS = [
  'claude', 'anthropic', 'mcp', 'claude code',
  'plugin', 'skill', 'tool use', 'agent', 'sdk',
];

export function noveltyScore(publishedAt: Date): number {
  const ageHours = (Date.now() - publishedAt.getTime()) / 36e5;
  if (ageHours >= NOVELTY_MAX_AGE_HOURS) return 0;
  if (ageHours <= 0) return 100;
  const score = 100 * (1 - ageHours / NOVELTY_MAX_AGE_HOURS);
  return Math.max(0, Math.min(100, score));
}

interface PopularityInput {
  stars?: number | null;
  forks?: number | null;
  mentions?: number | null;
}

export function popularityScore(input: PopularityInput): number {
  const s = input.stars ?? 0;
  const f = input.forks ?? 0;
  const m = input.mentions ?? 0;
  const raw = s + f * 2 + m * 5;
  if (raw <= 0) return 0;
  const score = (Math.log(1 + raw) / Math.log(1 + POP_CEILING)) * 100;
  return Math.min(100, score);
}

export function relevanceScore(input: { title: string; content?: string | null }): number {
  const title = input.title.toLowerCase();
  const content = (input.content ?? '').toLowerCase();
  let score = 0;
  for (const kw of KEYWORDS) {
    if (title.includes(kw)) score += 20;
    else if (content.includes(kw)) score += 10;
  }
  return Math.min(100, score);
}

export function totalScore(s: { novelty: number; popularity: number; relevance: number }): number {
  return s.novelty * 0.4 + s.popularity * 0.3 + s.relevance * 0.3;
}
```

- [ ] **Step 4: Run, PASS**

Run: `npm test -- ranking-engine`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/services/ranking-engine.ts lib/services/__tests__/ranking-engine.test.ts
git commit -m "feat: add RankingEngine with novelty/popularity/relevance scores"
```

---

## Task 6: FeedFetcher (TDD)

**Files:**
- Create: `lib/services/feed-fetcher.ts`, `lib/services/__tests__/feed-fetcher.test.ts`

- [ ] **Step 1: Test fallente con mock di rss-parser**

`lib/services/__tests__/feed-fetcher.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('rss-parser', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      parseURL: vi.fn().mockResolvedValue({
        items: [
          { title: 'Item 1', link: 'https://example.com/1', isoDate: '2026-04-15T10:00:00Z', contentSnippet: 'desc' },
          { title: 'Item 2', link: 'https://example.com/2', isoDate: '2026-04-15T11:00:00Z' },
        ],
      }),
    })),
  };
});

import { fetchRssFeed } from '../feed-fetcher';

describe('fetchRssFeed', () => {
  it('parses RSS and returns normalized items', async () => {
    const items = await fetchRssFeed('https://example.com/feed.xml');
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Item 1');
    expect(items[0].url).toBe('https://example.com/1');
    expect(items[0].publishedAt).toBeInstanceOf(Date);
  });

  it('returns empty array on error', async () => {
    const Parser = (await import('rss-parser')).default as any;
    Parser.mockImplementationOnce(() => ({
      parseURL: vi.fn().mockRejectedValue(new Error('network')),
    }));
    const items = await fetchRssFeed('https://broken.example.com/feed.xml');
    expect(items).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, FAIL**

- [ ] **Step 3: Implementare `lib/services/feed-fetcher.ts`**

```typescript
import Parser from 'rss-parser';

export interface NormalizedFeedItem {
  title: string;
  url: string;
  description: string | null;
  content: string | null;
  publishedAt: Date;
}

export async function fetchRssFeed(url: string): Promise<NormalizedFeedItem[]> {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    return (feed.items ?? [])
      .filter(i => i.link && i.title)
      .map(i => ({
        title: i.title!,
        url: i.link!,
        description: i.contentSnippet ?? null,
        content: (i as any).content ?? null,
        publishedAt: i.isoDate ? new Date(i.isoDate) : new Date(),
      }));
  } catch (err) {
    console.error(`[FeedFetcher] Error for ${url}:`, err);
    return [];
  }
}
```

- [ ] **Step 4: Run, PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/services/feed-fetcher.ts lib/services/__tests__/feed-fetcher.test.ts
git commit -m "feat: add FeedFetcher service with error handling"
```

---

## Task 7: GitHubScanner (TDD con mock Octokit)

**Files:**
- Create: `lib/github.ts`, `lib/services/github-scanner.ts`, `lib/services/__tests__/github-scanner.test.ts`

- [ ] **Step 1: Creare `lib/github.ts` (singleton)**

```typescript
import { Octokit } from '@octokit/rest';

export const github = new Octokit({ auth: process.env.GITHUB_TOKEN });
```

- [ ] **Step 2: Test fallente**

`lib/services/__tests__/github-scanner.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/github', () => ({
  github: {
    rest: {
      search: {
        repos: vi.fn().mockResolvedValue({
          data: {
            items: [
              {
                full_name: 'owner/awesome-claude',
                html_url: 'https://github.com/owner/awesome-claude',
                description: 'A great tool',
                stargazers_count: 500,
                forks_count: 50,
                topics: ['claude', 'mcp'],
                pushed_at: '2026-04-15T10:00:00Z',
              },
            ],
          },
        }),
      },
    },
  },
}));

import { searchGithubRepos } from '../github-scanner';

describe('searchGithubRepos', () => {
  it('returns normalized repos', async () => {
    const repos = await searchGithubRepos('topic:claude', { sinceDays: 30, limit: 100 });
    expect(repos).toHaveLength(1);
    expect(repos[0].title).toBe('owner/awesome-claude');
    expect(repos[0].githubStars).toBe(500);
    expect(repos[0].topics).toContain('mcp');
  });
});
```

- [ ] **Step 3: Run, FAIL**

- [ ] **Step 4: Implementare `lib/services/github-scanner.ts`**

```typescript
import { github } from '@/lib/github';

export interface NormalizedGithubRepo {
  title: string;
  url: string;
  description: string | null;
  publishedAt: Date;
  githubStars: number;
  githubForks: number;
  topics: string[];
}

interface ScanOptions {
  sinceDays: number;
  limit: number;
}

export async function searchGithubRepos(
  query: string,
  opts: ScanOptions
): Promise<NormalizedGithubRepo[]> {
  try {
    const sinceDate = new Date(Date.now() - opts.sinceDays * 86400000);
    const since = sinceDate.toISOString().slice(0, 10);
    const fullQuery = `${query} pushed:>=${since}`;

    const res = await github.rest.search.repos({
      q: fullQuery,
      sort: 'stars',
      order: 'desc',
      per_page: Math.min(100, opts.limit),
    });

    return res.data.items.map((r: any) => ({
      title: r.full_name,
      url: r.html_url,
      description: r.description ?? null,
      publishedAt: r.pushed_at ? new Date(r.pushed_at) : new Date(),
      githubStars: r.stargazers_count ?? 0,
      githubForks: r.forks_count ?? 0,
      topics: r.topics ?? [],
    }));
  } catch (err) {
    console.error(`[GithubScanner] Error:`, err);
    return [];
  }
}
```

- [ ] **Step 5: Run, PASS**

- [ ] **Step 6: Commit**

```bash
git add lib/github.ts lib/services/github-scanner.ts lib/services/__tests__/github-scanner.test.ts
git commit -m "feat: add GitHubScanner service"
```

---

## Task 8: AIEnricher (TDD con mock Anthropic)

**Files:**
- Create: `lib/anthropic.ts`, `lib/services/ai-enricher.ts`, `lib/services/__tests__/ai-enricher.test.ts`

- [ ] **Step 1: Creare `lib/anthropic.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const ENRICHMENT_MODEL = 'claude-sonnet-4-6';
```

- [ ] **Step 2: Test fallente**

`lib/services/__tests__/ai-enricher.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary: 'A test tool',
            practicalDescription: 'It does X by doing Y',
            useCase: 'Use it when you need Z',
          }),
        }],
      }),
    },
  },
  ENRICHMENT_MODEL: 'claude-sonnet-4-6',
}));

import { enrichItem } from '../ai-enricher';

describe('enrichItem', () => {
  it('returns parsed enrichment from Claude response', async () => {
    const result = await enrichItem({
      title: 'Claude MCP Server',
      description: 'A server',
      content: 'Detailed README',
    });
    expect(result.summary).toBe('A test tool');
    expect(result.practicalDescription).toContain('X');
    expect(result.useCase).toContain('Z');
  });
});
```

- [ ] **Step 3: Run, FAIL**

- [ ] **Step 4: Implementare `lib/services/ai-enricher.ts`**

```typescript
import { anthropic, ENRICHMENT_MODEL } from '@/lib/anthropic';

export interface EnrichmentInput {
  title: string;
  description?: string | null;
  content?: string | null;
}

export interface EnrichmentOutput {
  summary: string;
  practicalDescription: string;
  useCase: string;
}

const SYSTEM_PROMPT = `You analyze tools and news from the Claude/Anthropic AI ecosystem.
Given an item (plugin, skill, framework, or news article), produce a JSON object with:
- summary: 1-2 sentence summary
- practicalDescription: what it does and how it works in practice (2-3 sentences)
- useCase: a concrete example of when and how to use it (2-3 sentences)

Respond ONLY with valid JSON, no markdown fences.`;

export async function enrichItem(input: EnrichmentInput): Promise<EnrichmentOutput> {
  const userText = [
    `Title: ${input.title}`,
    input.description ? `Description: ${input.description}` : '',
    input.content ? `Content/README:\n${input.content.slice(0, 4000)}` : '',
  ].filter(Boolean).join('\n\n');

  const response = await anthropic.messages.create({
    model: ENRICHMENT_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userText }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const parsed = JSON.parse(textBlock.text);
  return {
    summary: parsed.summary ?? '',
    practicalDescription: parsed.practicalDescription ?? '',
    useCase: parsed.useCase ?? '',
  };
}
```

- [ ] **Step 5: Run, PASS**

- [ ] **Step 6: Commit**

```bash
git add lib/anthropic.ts lib/services/ai-enricher.ts lib/services/__tests__/ai-enricher.test.ts
git commit -m "feat: add AIEnricher service with Claude API integration"
```

---

## Task 9: PipelineStatus service

**Files:**
- Create: `lib/services/pipeline-status.ts`, `lib/services/__tests__/pipeline-status.test.ts`

- [ ] **Step 1: Test fallente**

`lib/services/__tests__/pipeline-status.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

const mockUpsert = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    pipelineStatus: {
      upsert: (...args: any[]) => mockUpsert(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
  },
}));

import { markStepCompleted, isStepCompleted } from '../pipeline-status';

describe('pipeline-status', () => {
  it('markStepCompleted upserts a record', async () => {
    mockUpsert.mockResolvedValue({});
    await markStepCompleted('FETCH', '2026-04-16');
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { step_date: { step: 'FETCH', date: '2026-04-16' } },
    }));
  });

  it('isStepCompleted returns true if record exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 'x' });
    expect(await isStepCompleted('FETCH', '2026-04-16')).toBe(true);
  });

  it('isStepCompleted returns false if record missing', async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await isStepCompleted('RANK', '2026-04-16')).toBe(false);
  });
});
```

- [ ] **Step 2: Run, FAIL**

- [ ] **Step 3: Implementare `lib/services/pipeline-status.ts`**

```typescript
import { db } from '@/lib/db';
import type { PipelineStep } from '@prisma/client';

export async function markStepCompleted(step: PipelineStep, date: string): Promise<void> {
  await db.pipelineStatus.upsert({
    where: { step_date: { step, date } },
    update: { completedAt: new Date() },
    create: { step, date, completedAt: new Date() },
  });
}

export async function isStepCompleted(step: PipelineStep, date: string): Promise<boolean> {
  const rec = await db.pipelineStatus.findUnique({
    where: { step_date: { step, date } },
  });
  return rec !== null;
}
```

- [ ] **Step 4: Run, PASS**

- [ ] **Step 5: Commit**

```bash
git add lib/services/pipeline-status.ts lib/services/__tests__/pipeline-status.test.ts
git commit -m "feat: add PipelineStatus service for cron coordination"
```

---

## Task 10: Cron route /api/cron/fetch

**Files:**
- Create: `app/api/cron/_auth.ts`, `app/api/cron/fetch/route.ts`, `app/api/cron/fetch/__tests__/route.test.ts`

- [ ] **Step 1: Creare middleware auth condiviso**

`app/api/cron/_auth.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export function authorizeCron(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
```

- [ ] **Step 2: Implementare `app/api/cron/fetch/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchRssFeed } from '@/lib/services/feed-fetcher';
import { searchGithubRepos } from '@/lib/services/github-scanner';
import { classifyItem } from '@/lib/services/item-classifier';
import { markStepCompleted } from '@/lib/services/pipeline-status';
import { dateUtcString } from '@/lib/utils/date';
import { slugify } from '@/lib/utils/slug';
import { authorizeCron } from '../_auth';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = authorizeCron(req);
  if (authError) return authError;

  const today = dateUtcString();
  const sources = await db.source.findMany({ where: { isActive: true } });
  let inserted = 0;

  for (const source of sources) {
    try {
      if (source.type === 'RSS') {
        const items = await fetchRssFeed(source.url);
        for (const item of items) {
          await upsertItem(source.id, source.type, item, []);
          inserted++;
        }
      } else if (source.type === 'GITHUB') {
        const isFirstRun = !source.lastFetchedAt;
        const repos = await searchGithubRepos(source.url, {
          sinceDays: isFirstRun ? 30 : 1,
          limit: 100,
        });
        for (const repo of repos) {
          await upsertItem(source.id, source.type, {
            title: repo.title,
            url: repo.url,
            description: repo.description,
            content: null,
            publishedAt: repo.publishedAt,
            githubStars: repo.githubStars,
            githubForks: repo.githubForks,
          }, repo.topics);
          inserted++;
        }
      }
      await db.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date() },
      });
    } catch (err) {
      console.error(`[fetch] error on source ${source.name}:`, err);
    }
  }

  await markStepCompleted('FETCH', today);
  return NextResponse.json({ ok: true, inserted, sources: sources.length, date: today });
}

async function upsertItem(
  sourceId: string,
  sourceType: 'RSS' | 'GITHUB',
  data: any,
  topics: string[]
) {
  const type = classifyItem({
    sourceType,
    title: data.title,
    description: data.description,
    topics,
  });

  const slug = slugify(data.title);

  await db.feedItem.upsert({
    where: { url: data.url },
    update: {
      title: data.title,
      description: data.description,
      content: data.content,
      githubStars: data.githubStars,
      githubForks: data.githubForks,
      mentionCount: { increment: 1 },
      type,
    },
    create: {
      sourceId,
      title: data.title,
      slug,
      url: data.url,
      description: data.description,
      content: data.content,
      publishedAt: data.publishedAt,
      type,
      githubStars: data.githubStars,
      githubForks: data.githubForks,
    },
  });
}
```

- [ ] **Step 3: Smoke test manuale**

Run: `npm run build`
Expected: build successful

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/_auth.ts app/api/cron/fetch/
git commit -m "feat: add /api/cron/fetch step 1 endpoint"
```

---

## Task 11: Cron route /api/cron/rank

**Files:**
- Create: `app/api/cron/rank/route.ts`

- [ ] **Step 1: Implementare**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  noveltyScore, popularityScore, relevanceScore, totalScore,
} from '@/lib/services/ranking-engine';
import { isStepCompleted, markStepCompleted } from '@/lib/services/pipeline-status';
import { dateUtcString } from '@/lib/utils/date';
import { authorizeCron } from '../_auth';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authError = authorizeCron(req);
  if (authError) return authError;

  const today = dateUtcString();
  if (!(await isStepCompleted('FETCH', today))) {
    return NextResponse.json({ skipped: true, reason: 'fetch not completed' });
  }

  const items = await db.feedItem.findMany({
    where: {
      publishedAt: { gte: new Date(Date.now() - 30 * 86400000) },
    },
  });

  const scored = items.map(item => {
    const novelty = noveltyScore(item.publishedAt);
    const popularity = popularityScore({
      stars: item.githubStars,
      forks: item.githubForks,
      mentions: item.mentionCount,
    });
    const relevance = relevanceScore({
      title: item.title,
      content: item.content ?? item.description,
    });
    const total = totalScore({ novelty, popularity, relevance });
    return { item, novelty, popularity, relevance, total };
  });

  scored.sort((a, b) => b.total - a.total);

  // Wrap in transaction to avoid empty-state window during recompute
  await db.$transaction([
    db.dailyRanking.deleteMany({ where: { date: today } }),
    ...scored.map((s, i) =>
      db.dailyRanking.create({
        data: {
          feedItemId: s.item.id,
          date: today,
          noveltyScore: s.novelty,
          popularityScore: s.popularity,
          relevanceScore: s.relevance,
          totalScore: s.total,
          rank: i + 1,
        },
      })
    ),
  ]);

  await markStepCompleted('RANK', today);
  return NextResponse.json({ ok: true, ranked: scored.length, date: today });
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/rank/
git commit -m "feat: add /api/cron/rank step 2 endpoint"
```

---

## Task 12: Cron route /api/cron/enrich

**Files:**
- Create: `app/api/cron/enrich/route.ts`

- [ ] **Step 1: Implementare**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enrichItem } from '@/lib/services/ai-enricher';
import { ENRICHMENT_MODEL } from '@/lib/anthropic';
import { isStepCompleted, markStepCompleted } from '@/lib/services/pipeline-status';
import { dateUtcString } from '@/lib/utils/date';
import { authorizeCron } from '../_auth';

export const maxDuration = 60;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;

export async function GET(req: NextRequest) {
  const authError = authorizeCron(req);
  if (authError) return authError;

  const today = dateUtcString();
  if (!(await isStepCompleted('RANK', today))) {
    return NextResponse.json({ skipped: true, reason: 'rank not completed' });
  }

  // Find items with no enrichment OR pending/retryable
  const items = await db.feedItem.findMany({
    where: {
      OR: [
        { enrichment: null },
        { enrichment: { status: 'PENDING', retryCount: { lt: MAX_RETRIES } } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await enrichItem({
        title: item.title,
        description: item.description,
        content: item.content,
      });
      await db.aIEnrichment.upsert({
        where: { feedItemId: item.id },
        update: {
          summary: result.summary,
          practicalDescription: result.practicalDescription,
          useCase: result.useCase,
          generatedAt: new Date(),
          model: ENRICHMENT_MODEL,
          status: 'COMPLETED',
        },
        create: {
          feedItemId: item.id,
          summary: result.summary,
          practicalDescription: result.practicalDescription,
          useCase: result.useCase,
          generatedAt: new Date(),
          model: ENRICHMENT_MODEL,
          status: 'COMPLETED',
        },
      });
      succeeded++;
    } catch (err) {
      console.error(`[enrich] error on item ${item.id}:`, err);
      const existing = await db.aIEnrichment.findUnique({ where: { feedItemId: item.id } });
      const newCount = (existing?.retryCount ?? 0) + 1;
      await db.aIEnrichment.upsert({
        where: { feedItemId: item.id },
        update: {
          retryCount: newCount,
          status: newCount >= MAX_RETRIES ? 'FAILED' : 'PENDING',
        },
        create: {
          feedItemId: item.id,
          retryCount: 1,
          status: 'PENDING',
        },
      });
      failed++;
    }
  }

  await markStepCompleted('ENRICH', today);
  return NextResponse.json({ ok: true, succeeded, failed, batch: BATCH_SIZE });
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/enrich/
git commit -m "feat: add /api/cron/enrich step 3 endpoint"
```

---

## Task 12b: Integration test per cron routes (auth + gating)

**Files:**
- Create: `app/api/cron/__tests__/auth.test.ts`, `app/api/cron/__tests__/gating.test.ts`

- [ ] **Step 1: Test auth fallisce senza CRON_SECRET**

`app/api/cron/__tests__/auth.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

beforeAll(() => { process.env.CRON_SECRET = 'test-secret'; });

describe('cron auth', () => {
  it('rejects missing Authorization header with 401', async () => {
    const { GET } = await import('@/app/api/cron/fetch/route');
    const req = new NextRequest('http://localhost/api/cron/fetch');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('rejects wrong secret with 401', async () => {
    const { GET } = await import('@/app/api/cron/fetch/route');
    const req = new NextRequest('http://localhost/api/cron/fetch', {
      headers: { authorization: 'Bearer wrong' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Test gating step**

`app/api/cron/__tests__/gating.test.ts`:
```typescript
import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => { process.env.CRON_SECRET = 'test-secret'; });

vi.mock('@/lib/db', () => ({
  db: {
    pipelineStatus: { findUnique: vi.fn().mockResolvedValue(null) },
    feedItem: { findMany: vi.fn().mockResolvedValue([]) },
    dailyRanking: { deleteMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}));

import { NextRequest } from 'next/server';

describe('cron gating', () => {
  it('rank skips when fetch incomplete', async () => {
    const { GET } = await import('@/app/api/cron/rank/route');
    const req = new NextRequest('http://localhost/api/cron/rank', {
      headers: { authorization: 'Bearer test-secret' },
    });
    const res = await GET(req);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(body.reason).toMatch(/fetch/);
  });
});
```

- [ ] **Step 3: Run, PASS**

Run: `npm test -- cron`

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/__tests__/
git commit -m "test: add integration tests for cron auth and step gating"
```

---

## Task 13: Configurazione Vercel cron + vercel.json

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Creare vercel.json**

```json
{
  "crons": [
    { "path": "/api/cron/fetch",  "schedule": "0 */6 * * *" },
    { "path": "/api/cron/rank",   "schedule": "5 */6 * * *" },
    { "path": "/api/cron/enrich", "schedule": "10 */6 * * *" }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: configure Vercel cron schedules"
```

---

## Task 14: API pubblica /api/items

**Files:**
- Create: `app/api/items/route.ts`

- [ ] **Step 1: Implementare**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import type { ItemType } from '@prisma/client';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const period = sp.get('period') ?? 'today'; // today | week | month
  const type = sp.get('type') as ItemType | null;
  const sort = sp.get('sort') ?? 'score'; // score | date
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(100, parseInt(sp.get('limit') ?? '20', 10));

  if (sort === 'score') {
    const days = period === 'today' ? 0 : period === 'week' ? 7 : 30;
    const sinceDate = new Date(Date.now() - days * 86400000);
    const dateFilter = period === 'today' ? dateUtcString() : { gte: dateUtcString(sinceDate) };

    const rankings = await db.dailyRanking.findMany({
      where: {
        date: typeof dateFilter === 'string' ? dateFilter : (dateFilter as any),
        ...(type ? { feedItem: { type } } : {}),
      },
      orderBy: period === 'today' ? { rank: 'asc' } : { totalScore: 'desc' },
      include: { feedItem: { include: { enrichment: true, source: true } } },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({ items: rankings, page, limit });
  }

  const items = await db.feedItem.findMany({
    where: type ? { type } : undefined,
    orderBy: { publishedAt: 'desc' },
    include: { enrichment: true, source: true },
    skip: (page - 1) * limit,
    take: limit,
  });
  return NextResponse.json({ items, page, limit });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/items/
git commit -m "feat: add public /api/items endpoint"
```

---

## Task 15: Setup shadcn/ui e componenti base

**Files:**
- Create: `components/ui/badge.tsx`, `components/ui/card.tsx`, `components/ui/button.tsx`, `lib/cn.ts`

- [ ] **Step 1: Creare `lib/cn.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Creare componenti UI minimal**

`components/ui/card.tsx`:
```tsx
import { cn } from '@/lib/cn';
import { HTMLAttributes, forwardRef } from 'react';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';
```

`components/ui/badge.tsx`:
```tsx
import { cn } from '@/lib/cn';
import { HTMLAttributes } from 'react';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium', className)} {...props} />;
}
```

`components/ui/button.tsx`:
```tsx
import { cn } from '@/lib/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn('rounded-md bg-purple-600 hover:bg-purple-700 px-4 py-2 text-sm font-medium text-white', className)} {...props} />
  )
);
Button.displayName = 'Button';
```

- [ ] **Step 3: Commit**

```bash
git add lib/cn.ts components/ui/
git commit -m "feat: add base UI components"
```

---

## Task 16: Componenti dashboard

**Files:**
- Create: `components/RankingList.tsx`, `components/RecentFeed.tsx`, `components/CategoryFilter.tsx`

- [ ] **Step 1: `components/RankingList.tsx`**

```tsx
import Link from 'next/link';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface Props {
  rankings: Array<{
    rank: number;
    totalScore: number;
    feedItem: {
      slug: string;
      title: string;
      type: string;
      githubStars: number | null;
    };
  }>;
}

const RANK_COLORS: Record<number, string> = {
  1: 'border-l-yellow-400',
  2: 'border-l-gray-300',
  3: 'border-l-amber-700',
};

export function RankingList({ rankings }: Props) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">🏆 Top Ranking Oggi</h2>
      <div className="space-y-2">
        {rankings.map(r => (
          <Link key={r.rank} href={`/item/${r.feedItem.slug}`}>
            <Card className={`flex items-center gap-3 border-l-4 ${RANK_COLORS[r.rank] ?? 'border-l-zinc-700'}`}>
              <div className="text-2xl font-bold">#{r.rank}</div>
              <div className="flex-1">
                <div className="font-medium">{r.feedItem.title}</div>
                <div className="text-xs text-zinc-500 flex gap-2">
                  <Badge className="bg-purple-100 text-purple-700">{r.feedItem.type}</Badge>
                  {r.feedItem.githubStars != null && <span>⭐ {r.feedItem.githubStars}</span>}
                  <span>Score: {r.totalScore.toFixed(0)}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: `components/RecentFeed.tsx`**

```tsx
import Link from 'next/link';
import { Card } from './ui/card';

interface Props {
  items: Array<{
    slug: string;
    title: string;
    publishedAt: Date;
    source: { name: string };
  }>;
}

export function RecentFeed({ items }: Props) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">📰 Ultimi Arrivi</h2>
      <div className="space-y-2">
        {items.map(i => (
          <Link key={i.slug} href={`/item/${i.slug}`}>
            <Card>
              <div className="font-medium">{i.title}</div>
              <div className="text-xs text-zinc-500 mt-1">
                {timeAgo(i.publishedAt)} · {i.source.name}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function timeAgo(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const hours = (Date.now() - date.getTime()) / 36e5;
  if (hours < 1) return 'pochi minuti fa';
  if (hours < 24) return `${Math.floor(hours)}h fa`;
  return `${Math.floor(hours / 24)}g fa`;
}
```

- [ ] **Step 3: `components/CategoryFilter.tsx`**

```tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const TYPES = ['ALL', 'PLUGIN', 'NEWS', 'SKILL', 'FRAMEWORK'] as const;

export function CategoryFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get('type') ?? 'ALL';

  const setType = (t: string) => {
    const newSp = new URLSearchParams(sp.toString());
    if (t === 'ALL') newSp.delete('type');
    else newSp.set('type', t);
    router.push(`/?${newSp.toString()}`);
  };

  return (
    <div className="flex gap-2 mb-4">
      {TYPES.map(t => (
        <button
          key={t}
          onClick={() => setType(t)}
          className={`px-3 py-1 rounded text-sm ${current === t ? 'bg-purple-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/
git commit -m "feat: add dashboard components"
```

---

## Task 17: Dashboard page (/) con SSR

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Implementare**

```tsx
import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import { RankingList } from '@/components/RankingList';
import { RecentFeed } from '@/components/RecentFeed';
import { CategoryFilter } from '@/components/CategoryFilter';
import type { ItemType } from '@prisma/client';

export const revalidate = 1800; // 30 min

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const today = dateUtcString();
  const itemType = type as ItemType | undefined;

  const rankings = await db.dailyRanking.findMany({
    where: {
      date: today,
      ...(itemType ? { feedItem: { type: itemType } } : {}),
    },
    orderBy: { rank: 'asc' },
    include: { feedItem: true },
    take: 10,
  });

  const recent = await db.feedItem.findMany({
    where: itemType ? { type: itemType } : undefined,
    orderBy: { publishedAt: 'desc' },
    include: { source: true },
    take: 10,
  });

  return (
    <main className="container mx-auto p-6 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">⚡ AI Feeds</h1>
        <p className="text-zinc-500">Le novità dell'ecosistema Claude, classificate ogni giorno</p>
      </header>
      <CategoryFilter />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RankingList rankings={rankings} />
        <RecentFeed items={recent} />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add dashboard homepage with SSR"
```

---

## Task 18: Pagina dettaglio item

**Files:**
- Create: `app/item/[slug]/page.tsx`, `components/ItemHeader.tsx`, `components/ScoreBreakdown.tsx`, `components/ScoreHistoryChart.tsx`

- [ ] **Step 1: `components/ScoreHistoryChart.tsx`**

```tsx
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ date: string; totalScore: number }>;
}

export function ScoreHistoryChart({ data }: Props) {
  if (data.length === 0) return <p className="text-zinc-500">Nessuno storico disponibile</p>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="totalScore" stroke="#7c6bf5" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: `components/ItemHeader.tsx` e `ScoreBreakdown.tsx`**

```tsx
// ItemHeader.tsx
import { Badge } from './ui/badge';

interface Props {
  type: string;
  title: string;
  publishedAt: Date | string;
  rank?: number;
}

export function ItemHeader({ type, title, publishedAt, rank }: Props) {
  const date = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  return (
    <header className="mb-6">
      <div className="flex gap-2 mb-2">
        <Badge className="bg-purple-600 text-white">{type}</Badge>
        {rank && <Badge className="bg-yellow-400 text-black">#{rank} oggi</Badge>}
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-zinc-500">Pubblicato {date.toLocaleString('it-IT')}</p>
    </header>
  );
}
```

```tsx
// ScoreBreakdown.tsx
import { Card } from './ui/card';

interface Props {
  novelty: number;
  popularity: number;
  relevance: number;
  total: number;
}

export function ScoreBreakdown({ novelty, popularity, relevance, total }: Props) {
  return (
    <Card>
      <div className="text-center mb-2">
        <div className="text-5xl font-extrabold text-purple-500">{total.toFixed(0)}</div>
        <div className="text-xs text-zinc-500">SCORE TOTALE</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center"><div className="font-semibold">{novelty.toFixed(0)}</div><div className="text-xs text-zinc-500">Novità</div></div>
        <div className="text-center"><div className="font-semibold">{popularity.toFixed(0)}</div><div className="text-xs text-zinc-500">Popolarità</div></div>
        <div className="text-center"><div className="font-semibold">{relevance.toFixed(0)}</div><div className="text-xs text-zinc-500">Rilevanza</div></div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: `app/item/[slug]/page.tsx`**

```tsx
import { db } from '@/lib/db';
import { dateUtcString } from '@/lib/utils/date';
import { ItemHeader } from '@/components/ItemHeader';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { ScoreHistoryChart } from '@/components/ScoreHistoryChart';
import { Card } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 1800;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const today = dateUtcString();

  const item = await db.feedItem.findUnique({
    where: { slug },
    include: {
      enrichment: true,
      source: true,
      rankings: { orderBy: { date: 'asc' } },
    },
  });

  if (!item) notFound();

  const todayRanking = item.rankings.find(r => r.date === today);

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <Link href="/" className="text-sm text-purple-500">← Torna alla dashboard</Link>
      <ItemHeader
        type={item.type}
        title={item.title}
        publishedAt={item.publishedAt}
        rank={todayRanking?.rank}
      />

      {todayRanking && (
        <div className="mb-6">
          <ScoreBreakdown
            novelty={todayRanking.noveltyScore}
            popularity={todayRanking.popularityScore}
            relevance={todayRanking.relevanceScore}
            total={todayRanking.totalScore}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="font-semibold mb-2">📖 Descrizione Pratica</h3>
          <p>{item.enrichment?.practicalDescription || item.description || 'In elaborazione...'}</p>
        </Card>
        <Card>
          <h3 className="font-semibold mb-2">🎯 Use Case</h3>
          <p>{item.enrichment?.useCase || 'In elaborazione...'}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold mb-2">📊 Storico Score</h3>
        <ScoreHistoryChart data={item.rankings.map(r => ({ date: r.date, totalScore: r.totalScore }))} />
      </Card>

      <div className="flex gap-2">
        <a href={item.url} target="_blank" rel="noopener noreferrer"
           className="px-4 py-2 bg-purple-600 text-white rounded">
          🔗 Vai al sito
        </a>
        <span className="text-sm text-zinc-500 self-center">Fonte: {item.source.name}</span>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add app/item/ components/ItemHeader.tsx components/ScoreBreakdown.tsx components/ScoreHistoryChart.tsx
git commit -m "feat: add item detail page with score breakdown and history chart"
```

---

## Task 19: NextAuth v5 + admin login (Edge-safe split)

**Files:**
- Create: `auth.config.ts` (Edge-safe), `lib/auth.ts` (full runtime), `app/api/auth/[...nextauth]/route.ts`, `app/admin/login/page.tsx`, `middleware.ts`

NextAuth v5 richiede di separare la config edge-safe (per il middleware) dalla config completa che usa Prisma+bcrypt (incompatibili con Edge runtime).

- [ ] **Step 1: `auth.config.ts` (Edge-safe, no Prisma/bcrypt)**

```typescript
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/admin/login' },
  providers: [], // riempito in lib/auth.ts
  callbacks: {
    authorized({ auth, request }) {
      const isAdmin = request.nextUrl.pathname.startsWith('/admin');
      const isLogin = request.nextUrl.pathname === '/admin/login';
      if (isAdmin && !isLogin) return !!auth;
      return true;
    },
  },
  session: { strategy: 'jwt' },
};
```

- [ ] **Step 2: `lib/auth.ts` (runtime completo Node)**

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { authConfig } from '@/auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await db.adminUser.findUnique({ where: { email: String(creds.email) } });
        if (!user) return null;
        const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
});
```

- [ ] **Step 3: `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

- [ ] **Step 4: `middleware.ts` (importa solo authConfig — edge-safe)**

```typescript
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 4: `app/admin/login/page.tsx`**

```tsx
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) setErr('Credenziali non valide');
    else window.location.href = '/admin';
  };

  return (
    <main className="container mx-auto p-6 max-w-sm">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
               className="w-full p-2 border rounded" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
               className="w-full p-2 border rounded" required />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        <button className="w-full p-2 bg-purple-600 text-white rounded">Accedi</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add auth.config.ts lib/auth.ts app/api/auth app/admin middleware.ts
git commit -m "feat: add NextAuth v5 with edge-safe split for middleware"
```

---

## Task 19b: Pagina storico ranking (/ranking/[date])

**Files:**
- Create: `app/ranking/[date]/page.tsx`

- [ ] **Step 1: Implementare pagina**

```tsx
import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 1800;

interface Props {
  params: Promise<{ date: string }>;
}

export default async function RankingDatePage({ params }: Props) {
  const { date } = await params;

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const rankings = await db.dailyRanking.findMany({
    where: { date },
    orderBy: { rank: 'asc' },
    include: { feedItem: true },
  });

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <Link href="/" className="text-sm text-purple-500">← Torna alla dashboard</Link>
      <h1 className="text-3xl font-bold my-4">Ranking del {date}</h1>
      {rankings.length === 0 ? (
        <p className="text-zinc-500">Nessun ranking disponibile per questa data.</p>
      ) : (
        <div className="space-y-2">
          {rankings.map(r => (
            <Link key={r.id} href={`/item/${r.feedItem.slug}`}>
              <Card className="flex items-center gap-3">
                <div className="text-2xl font-bold">#{r.rank}</div>
                <div className="flex-1">
                  <div className="font-medium">{r.feedItem.title}</div>
                  <div className="text-xs text-zinc-500 flex gap-2">
                    <Badge className="bg-purple-100 text-purple-700">{r.feedItem.type}</Badge>
                    <span>Score: {r.totalScore.toFixed(0)}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/ranking/
git commit -m "feat: add /ranking/[date] historical ranking page"
```

---

## Task 20: Admin panel + endpoint refresh

**Files:**
- Create: `app/admin/page.tsx`, `app/api/admin/sources/route.ts`, `app/api/admin/refresh/route.ts`

- [ ] **Step 1: `app/admin/page.tsx`**

```tsx
import { db } from '@/lib/db';
import { signOut } from '@/lib/auth';

export default async function AdminPage() {
  const sources = await db.source.findMany({ orderBy: { name: 'asc' } });
  const lastFetch = await db.pipelineStatus.findFirst({
    where: { step: 'FETCH' }, orderBy: { completedAt: 'desc' },
  });

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }); }}>
          <button className="text-sm text-zinc-500">Logout</button>
        </form>
      </header>
      <p className="mb-4">Ultimo fetch: {lastFetch?.completedAt.toLocaleString('it-IT') ?? 'mai'}</p>
      <h2 className="text-xl font-semibold mb-2">Fonti ({sources.length})</h2>
      <ul className="space-y-2">
        {sources.map(s => (
          <li key={s.id} className="p-3 border rounded flex justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-zinc-500">{s.type} · {s.url}</div>
            </div>
            <span className={s.isActive ? 'text-green-600' : 'text-zinc-400'}>
              {s.isActive ? 'Attiva' : 'Disattiva'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: `app/api/admin/refresh/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const baseUrl = req.nextUrl.origin;
  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };

  // Fire-and-forget: trigger fetch endpoint
  fetch(`${baseUrl}/api/cron/fetch`, { headers }).catch(console.error);

  return NextResponse.json({ ok: true, triggered: 'fetch' });
});
```

- [ ] **Step 3: `app/api/admin/sources/route.ts`** (CRUD base)

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const GET = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sources = await db.source.findMany();
  return NextResponse.json(sources);
});

export const POST = auth(async (req) => {
  if (!req.auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const created = await db.source.create({
    data: {
      name: body.name,
      type: body.type,
      url: body.url,
      category: body.category,
    },
  });
  return NextResponse.json(created);
});
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx app/api/admin/
git commit -m "feat: add admin panel with sources view and refresh trigger"
```

---

## Task 21: Seed Prisma (admin + fonti iniziali)

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Implementare seed**

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const SOURCES = [
  { name: 'Anthropic Blog', type: 'RSS' as const, url: 'https://www.anthropic.com/news/rss.xml', category: 'official' },
  { name: 'Hacker News (Claude)', type: 'RSS' as const, url: 'https://hnrss.org/newest?q=claude+OR+anthropic', category: 'community' },
  { name: 'Dev.to (claude)', type: 'RSS' as const, url: 'https://dev.to/feed/tag/claude', category: 'community' },
  { name: 'Dev.to (anthropic)', type: 'RSS' as const, url: 'https://dev.to/feed/tag/anthropic', category: 'community' },
  { name: 'Reddit r/ClaudeAI', type: 'RSS' as const, url: 'https://www.reddit.com/r/ClaudeAI/.rss', category: 'community' },
  { name: 'GitHub: topic claude', type: 'GITHUB' as const, url: 'topic:claude', category: 'tools' },
  { name: 'GitHub: topic mcp', type: 'GITHUB' as const, url: 'topic:mcp', category: 'tools' },
  { name: 'GitHub: topic claude-code', type: 'GITHUB' as const, url: 'topic:claude-code', category: 'tools' },
];

async function main() {
  // Seed admin
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (email && passwordHash) {
    await db.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    console.log(`✅ Admin user upserted: ${email}`);
  }

  // Seed sources
  for (const s of SOURCES) {
    await db.source.upsert({
      where: { url: s.url },
      update: {},
      create: s,
    });
  }
  console.log(`✅ ${SOURCES.length} sources upserted`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
```

- [ ] **Step 2: Aggiungere prisma seed config a package.json**

Aggiungere:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add Prisma seed for admin user and initial sources"
```

---

## Task 22: README e deploy docs

**Files:**
- Create: `README.md`

- [ ] **Step 1: Scrivere README**

```markdown
# AI Feeds

Web app che aggrega notizie e tool dell'ecosistema Claude/Anthropic con ranking giornaliero AI-powered.

## Setup

1. `npm install`
2. Copia `.env.example` in `.env.local` e compila i valori
3. `npx prisma db push` per creare lo schema sul DB
4. `npm run db:seed` per inserire admin + fonti iniziali
5. `npm run dev`

## Generare ADMIN_PASSWORD_HASH

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

## Deploy su Vercel

1. Connettere il repo a Vercel (piano **Pro** richiesto per cron e timeout 60s)
2. Configurare le env vars (vedi `.env.example`)
3. Vercel rileva automaticamente i cron in `vercel.json`

## Pipeline

3 cron job sfalsati ogni 6h:
- `/api/cron/fetch` (00:00) — raccoglie da RSS e GitHub
- `/api/cron/rank` (00:05) — calcola ranking
- `/api/cron/enrich` (00:10) — arricchisce con Claude API (5 item/ciclo)

## Test

- Unit: `npm test`
- Build check: `npm run build`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and deploy instructions"
```

---

## Task 23: Smoke test E2E con Playwright

**Files:**
- Create: `playwright.config.ts`, `e2e/dashboard.spec.ts`

- [ ] **Step 1: `playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: `e2e/dashboard.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads with title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('AI Feeds');
});

test('category filter is rendered', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'PLUGIN' })).toBeVisible();
});
```

- [ ] **Step 3: Install Playwright browsers**

Run: `npx playwright install chromium`

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e/
git commit -m "test: add Playwright E2E smoke tests"
```

---

## Final Steps

- [ ] Run `npm run build` e verificare nessun errore
- [ ] Run `npm test` e verificare tutti i test verdi
- [ ] Verificare `.env.local` configurato per testing locale
- [ ] Push del repo e deploy su Vercel Pro
- [ ] Eseguire `npm run db:seed` in remoto
- [ ] Verificare che il primo cron giri correttamente (controllare Vercel logs)
