# AI Feeds

> Le novità dell'ecosistema Claude, classificate ogni giorno

AI Feeds è una piattaforma che aggrega, classifica e arricchisce automaticamente contenuti dall'ecosistema Claude/Anthropic AI. Raccoglie plugin, skill, framework e notizie da RSS e GitHub, li classifica con un algoritmo di scoring, e genera descrizioni e guide di studio con l'AI.

**Live**: [ai-feed-sigma.vercel.app](https://ai-feed-sigma.vercel.app)

## Funzionalità

### Dashboard
- **Ranking giornaliero** con punteggio basato su popolarità, novità e rilevanza
- **Filtri per tipo** (Plugin, News, Skill, Framework) e **filtro AI Enriched**
- **Ricerca** full-text per titolo
- **Paginazione** (20 item per pagina)
- **Card rich** con medaglie top 3, barra score, stelle GitHub, descrizione AI

### Pagina Item
- **Score breakdown** con card colorate e barre di progresso
- **Sommario AI** e **descrizione pratica** generati da Claude
- **Box "Come usarlo nel tuo workflow"** — scenari concreti per sviluppatori
- **Quick Start** — comandi di installazione per repo GitHub
- **Guida allo Studio** — genera on-demand una guida completa con AI (installazione, configurazione, esempi di codice, best practices)
- **Storico score** con grafico temporale
- **Link diretti** a GitHub Issues, Pull Requests

### Admin Panel
- **Stats dashboard** — item totali, ranked, enriched, pending/failed
- **Pipeline controls** — trigger manuale di Fetch, Rank, Enrich
- **Gestione fonti** — aggiungi, attiva/disattiva, elimina fonti RSS e GitHub

### Pipeline Automatica
- **Fetch** — raccoglie item da RSS feed e ricerca GitHub (topic + testo)
- **Rank** — classifica giornaliera con algoritmo multi-fattore
- **Enrich** — arricchimento AI con sommario, descrizione pratica, use case (20 item/ciclo)
- **Scheduling** — ogni 6 ore via GitHub Actions

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Neon PostgreSQL (serverless)
- **AI**: Anthropic Claude API (claude-sonnet-4-6)
- **GitHub**: Octokit REST API
- **Auth**: NextAuth v5 con credentials
- **Deploy**: Vercel
- **Cron**: GitHub Actions

## Setup locale

### Prerequisiti

- Node.js 20+
- Account [Neon](https://neon.tech) (database PostgreSQL)
- [Anthropic API key](https://console.anthropic.com)
- [GitHub Personal Access Token](https://github.com/settings/tokens)

### Installazione

```bash
git clone https://github.com/Cyclope23/ai-feed.git
cd ai-feed
npm install
```

### Configurazione

Crea `.env.local`:

```env
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-ant-..."
GITHUB_TOKEN="ghp_..."
AUTH_SECRET="<genera con: openssl rand -base64 32>"
AUTH_TRUST_HOST=true
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD_HASH="<genera con: node -e \"console.log(require('bcryptjs').hashSync('password', 10))\">"
CRON_SECRET="<genera con: openssl rand -hex 32>"
```

Copia `DATABASE_URL` anche in `.env` per i comandi Prisma CLI.

### Database

```bash
npm run db:push    # crea le tabelle
npm run db:seed    # seed fonti + admin user
```

### Avvio

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Algoritmo di Scoring

Ogni item viene classificato giornalmente con un punteggio composito:

| Fattore | Peso | Formula |
|---------|------|---------|
| **Popolarità** | 40% | `sqrt(stars×1.5 + forks×3 + mentions×5) / sqrt(200000) × 100` |
| **Novità** | 30% | Decadimento lineare: 100 → 0 in 30 giorni |
| **Rilevanza** | 30% | Match keyword (claude, anthropic, mcp, sdk, agent...) |

## Struttura del progetto

```
app/
├── page.tsx                        # Homepage con ranking
├── item/[slug]/page.tsx            # Dettaglio item
├── ranking/[date]/page.tsx         # Ranking storico
├── admin/                          # Admin panel + login
├── api/
│   ├── cron/{fetch,rank,enrich}    # Pipeline endpoints
│   ├── admin/{stats,pipeline,sources}  # Admin API
│   └── item/[slug]/study           # Study guide generation
components/
├── RankingList.tsx                 # Lista ranking con filtri e paginazione
├── StudyGuide.tsx                  # Componente guida allo studio
├── ScoreHistoryChart.tsx           # Grafico storico score
└── ui/                             # Componenti UI base (Card, Badge, Button)
lib/
├── services/
│   ├── ranking-engine.ts           # Algoritmo di scoring
│   ├── ai-enricher.ts              # Enrichment con Claude
│   ├── study-generator.ts          # Generazione guide studio
│   ├── feed-fetcher.ts             # Parser RSS
│   ├── github-scanner.ts           # Ricerca GitHub
│   ├── item-classifier.ts          # Classificazione tipo
│   └── pipeline-status.ts          # Coordinamento pipeline
├── db.ts                           # Prisma client
├── auth.ts                         # NextAuth config
└── anthropic.ts                    # Client Anthropic
prisma/
├── schema.prisma                   # Schema database
└── seed.ts                         # Seed data
```

## Test

```bash
npm test             # Unit test con Vitest
npm run test:e2e     # E2E test con Playwright
npm run build        # Build check
npm run lint         # Linting
```

## Deploy su Vercel

1. Connetti il repo a Vercel
2. Configura le environment variables
3. I cron job girano via GitHub Actions (`.github/workflows/cron-pipeline.yml`)
4. GitHub Actions secrets necessari: `CRON_SECRET`, `APP_URL`

## License

MIT
