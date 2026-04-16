# AI Feeds — Design Spec

## Panoramica

Web app che aggrega e classifica quotidianamente notizie, plugin, skill e framework dell'ecosistema Claude/Anthropic. Combina feed RSS/Atom con monitoraggio GitHub per fornire un ranking giornaliero basato su novità, popolarità e rilevanza. Ogni item viene arricchito con descrizione pratica e use case generati da AI.

## Obiettivi

1. Avere un punto unico dove monitorare tutte le novità legate a Claude
2. Ranking giornaliero automatico che evidenzi le novità più rilevanti
3. Per ogni plugin/skill/framework: link web, descrizione pratica e use case concreto
4. Area admin per gestire fonti e configurazione

## Architettura

### Stack Tecnologico

- **Next.js 15** (App Router) — frontend e backend in un unico progetto
- **Prisma ORM** + **PostgreSQL** (Neon) — persistenza dati
- **Tailwind CSS** + **shadcn/ui** — UI components
- **NextAuth.js** (credentials provider) — autenticazione admin
- **Vercel Cron** — scheduling fetch periodico
- **Claude API** (claude-sonnet-4-6) — arricchimento AI
- **Octokit** — GitHub API
- **Recharts** — grafici storico score

### Diagramma Architetturale

```
┌─────────────────────────────────────────────┐
│              Vercel (Next.js)                │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Frontend  │  │API Routes│  │Vercel Cron│ │
│  │ (React)   │←→│ /api/*   │  │ (schedule)│ │
│  └──────────┘  └────┬─────┘  └─────┬─────┘ │
│                     │              │        │
│                     ▼              ▼        │
│              ┌─────────────────────┐        │
│              │   Service Layer     │        │
│              │ - FeedFetcher       │        │
│              │ - GitHubScanner     │        │
│              │ - RankingEngine     │        │
│              │ - AIEnricher        │        │
│              └────────┬────────────┘        │
│                       │                     │
└───────────────────────┼─────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  PostgreSQL      │
              │  (Neon)          │
              │  via Prisma ORM  │
              └──────────────────┘
```

### Flusso Dati — Pipeline a 3 Step

Il pipeline è decomposto in 3 API route separate, schedulate come **cron job indipendenti a orari sfalsati**. Ogni step verifica che il precedente sia completato leggendo un record `PipelineStatus` dal DB prima di eseguire.

**Step 1 — `/api/cron/fetch`** (Vercel Cron: `0 */6 * * *` — ogni 6h)
1. **FeedFetcher** raccoglie articoli da fonti RSS/Atom configurate
2. **GitHubScanner** cerca nuovi repo/release con topic Claude/Anthropic/MCP via GitHub API
3. Deduplicazione: se un item con lo stesso URL esiste già, aggiorna i metadati (stelle, menzioni)
4. **ItemClassifier** assegna il tipo (NEWS/PLUGIN/SKILL/FRAMEWORK) — vedi sezione Classificazione
5. Scrive `PipelineStatus { step: 'fetch', date: today, completedAt: now }`

**Step 2 — `/api/cron/rank`** (Vercel Cron: `5 */6 * * *` — 5 min dopo Step 1)
1. Controlla che Step 1 sia completato per oggi, altrimenti esce (no-op)
2. **RankingEngine** calcola lo score ibrido per tutti gli item del giorno
3. Scrive `PipelineStatus { step: 'rank', date: today, completedAt: now }`

**Step 3 — `/api/cron/enrich`** (Vercel Cron: `10 */6 * * *` — 10 min dopo Step 1)
1. Controlla che Step 2 sia completato per oggi, altrimenti esce (no-op)
2. **AIEnricher** genera descrizione pratica e use case per max 5 nuovi item per ciclo
3. Gli item non ancora arricchiti vengono processati al ciclo successivo (coda FIFO)

Il frontend serve i dati con SSR/ISR (revalidate ogni 30 minuti) per performance ottimali.

**Requisito piano Vercel:** Piano Pro (timeout 60s per API route, cron multipli). Il piano Hobby non è sufficiente per questa pipeline.

## Modello Dati

### Source

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | String (cuid) | PK |
| name | String | Nome della fonte (es. "Anthropic Blog") |
| type | Enum: RSS, GITHUB | Tipo di fonte |
| url | String | URL del feed RSS o search query GitHub |
| category | String? | Categoria opzionale |
| isActive | Boolean | Se la fonte è attiva |
| lastFetchedAt | DateTime? | Ultimo fetch riuscito |
| fetchIntervalHours | Int | Intervallo fetch in ore (default: 6) |
| createdAt | DateTime | Data creazione |

### FeedItem

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | String (cuid) | PK |
| sourceId | String | FK → Source |
| title | String | Titolo dell'item |
| slug | String (unique) | Slug per URL |
| url | String (unique) | URL originale |
| description | String? | Descrizione originale |
| content | String? | Contenuto completo (se disponibile) |
| publishedAt | DateTime | Data pubblicazione |
| type | Enum: NEWS, PLUGIN, SKILL, FRAMEWORK | Classificazione (vedi sezione Classificazione) |
| githubStars | Int? | Stelle GitHub (se repo) |
| githubForks | Int? | Fork GitHub (se repo) |
| mentionCount | Int | Numero di fonti che ne parlano |
| imageUrl | String? | Immagine di anteprima |
| createdAt | DateTime | Data inserimento nel sistema |
| updatedAt | DateTime | Ultimo aggiornamento |

### DailyRanking

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | String (cuid) | PK |
| feedItemId | String | FK → FeedItem |
| date | String (YYYY-MM-DD) | Data del ranking in UTC, formato ISO date-only |
| noveltyScore | Float | Score novità (0-100) |
| popularityScore | Float | Score popolarità (0-100) |
| relevanceScore | Float | Score keyword relevance (0-100) |
| totalScore | Float | Score finale pesato |
| rank | Int | Posizione nel ranking del giorno |

**Constraint:** unique(feedItemId, date) — un item ha un solo ranking per giorno.

**Indici:** `@@index([date, rank])` — ottimizza la query principale (ranking per data ordinato per posizione).

### AIEnrichment

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | String (cuid) | PK |
| feedItemId | String (unique) | FK → FeedItem |
| summary | String | Riassunto breve |
| practicalDescription | String | Descrizione pratica: cosa fa e come funziona |
| useCase | String | Use case concreto di utilizzo |
| generatedAt | DateTime | Data generazione |
| model | String | Modello Claude usato |
| retryCount | Int (default: 0) | Tentativi di generazione. Max 3: dopo 3 fallimenti l'item viene marcato come `enrichmentFailed` e saltato |
| status | Enum: PENDING, COMPLETED, FAILED | Stato dell'arricchimento |

### PipelineStatus

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | String (cuid) | PK |
| step | Enum: FETCH, RANK, ENRICH | Step della pipeline |
| date | String (YYYY-MM-DD) | Data del ciclo in UTC |
| completedAt | DateTime | Timestamp completamento |

**Constraint:** unique(step, date) — uno step può completare una sola volta per giorno.

### AdminUser

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | String (cuid) | PK |
| email | String (unique) | Email |
| passwordHash | String | Password hash (bcrypt) |
| createdAt | DateTime | Data creazione |

## UI / Frontend

### Layout: Dashboard (due colonne)

La homepage usa un layout a due colonne:

- **Colonna sinistra — Top Ranking:** podio giornaliero con i top item ordinati per score. Ogni card mostra: posizione, titolo, tipo (badge), score, stelle GitHub
- **Colonna destra — Ultimi Arrivi:** feed cronologico degli item più recenti con fonte e timestamp
- **Header:** logo, filtri per categoria (Tutti, Plugin, News, Skills, Framework), selettore periodo (Oggi, Settimana)

Su mobile le colonne diventano stacked (ranking sopra, ultimi arrivi sotto).

### Pagina Dettaglio (`/item/[slug]`)

Pagina dedicata con URL proprio, condivisibile. Contiene:

- **Header:** badge tipo, posizione ranking, titolo, autore, data pubblicazione
- **Score:** numero grande con breakdown (novità/popolarità/rilevanza)
- **Metriche:** stelle GitHub, fork, numero fonti
- **Descrizione AI:** summary + descrizione pratica generata da Claude
- **Use Case:** caso d'uso concreto generato da Claude
- **Link:** pulsanti per GitHub repo, README, sito web
- **Storico Score:** andamento del punteggio nel tempo

### Pagine

| Route | Descrizione |
|-------|-------------|
| `/` | Dashboard: Top ranking + ultimi arrivi + filtri categoria |
| `/item/[slug]` | Dettaglio item: score, descrizione AI, use case, link |
| `/ranking/[date]` | Storico ranking per data specifica |
| `/admin` | Area protetta: gestione fonti, refresh manuale, config pesi ranking |
| `/api/cron/fetch` | Step 1: fetch feed + classificazione |
| `/api/cron/rank` | Step 2: calcolo ranking giornaliero |
| `/api/cron/enrich` | Step 3: arricchimento AI (batch 5 item) |
| `/api/items` | API: lista item — query params: `period` (today/week/month), `type` (news/plugin/skill/framework), `page`, `limit`, `sort` (score/date) |

## Servizi Backend

### FeedFetcher

- Parsing RSS/Atom da fonti configurate
- Estrae: titolo, URL, descrizione, data pubblicazione, contenuto
- Deduplicazione per URL
- Error handling per fonte: se una fonte fallisce (es. Reddit RSS inaffidabile), logga l'errore e continua con le altre
- Fonti preconfigurate: Anthropic Blog, Hacker News (filtro Claude/Anthropic), Dev.to (tag claude, anthropic, mcp), Reddit r/ClaudeAI (best-effort, può fallire silenziosamente)

### GitHubScanner

- Ricerca repo via GitHub API con query: topic "claude", "mcp", "anthropic", "claude-code"
- Raccoglie: stelle, fork, data ultimo commit, release recenti
- Monitora nuove release di repo già tracciati
- Rate limiting rispettato con Octokit
- **Primo avvio:** limita ai repo creati/aggiornati negli ultimi 30 giorni, max 100 risultati per query
- **Esecuzioni successive:** solo repo aggiornati dopo `lastFetchedAt` della source

### ItemClassifier

Classifica automaticamente ogni nuovo item in uno dei tipi `NEWS | PLUGIN | SKILL | FRAMEWORK`:

- **Da GitHub:** se il repo ha topic/keyword "plugin" → PLUGIN, "skill" → SKILL, "framework"/"sdk"/"library" → FRAMEWORK, altrimenti PLUGIN (default per repo)
- **Da RSS:** default NEWS, a meno che titolo/descrizione contenga keyword specifiche ("plugin", "skill", "framework", "sdk")
- Override manuale possibile dall'admin

### RankingEngine

- **Novelty Score (40%):** basato su `publishedAt`. Formula: `max(0, 100 - hoursAge * decayFactor)`. Decay configurabile
- **Popularity Score (30%):** normalizzazione logaritmica con tetto fisso. `min(100, log(1 + stars + forks * 2 + mentions * 5) / log(1 + 50000) * 100)`. Il tetto di 50000 è una costante fissa, garantendo comparabilità storica degli score
- **Relevance Score (30%):** keyword matching pesato su titolo e contenuto. Keywords: "Claude", "Anthropic", "MCP", "Claude Code", "plugin", "skill", "tool use", ecc. Match nel titolo vale 2x rispetto al contenuto
- **Total Score:** `novelty * 0.4 + popularity * 0.3 + relevance * 0.3`
- Pesi configurabili dall'admin

### AIEnricher

- Chiamata Claude API (claude-sonnet-4-6) in batch di max **5 item per ciclo** (step 3 della pipeline)
- Input: titolo + descrizione + contenuto/README
- Output strutturato:
  - `summary`: 1-2 frasi riassuntive
  - `practicalDescription`: cosa fa lo strumento e come funziona in pratica
  - `useCase`: esempio concreto di quando e come usarlo
- Generato una sola volta per item, salvato in `AIEnrichment`
- Coda FIFO: gli item senza arricchimento vengono processati in ordine di creazione ai cicli successivi
- Fallback: se la API fallisce per un item, l'item viene rimesso in coda per il prossimo ciclo

### AdminAuth

- NextAuth.js con credentials provider
- Singolo utente admin (email + password hash bcrypt)
- Protegge solo le route `/admin/*`
- **Seeding:** Prisma seed script che fa upsert dell'admin user usando `ADMIN_EMAIL` e `ADMIN_PASSWORD_HASH` da env. Eseguito con `prisma db seed` al primo deploy e dopo ogni migrazione

## Fonti RSS Preconfigurate

| Fonte | Tipo | URL/Query |
|-------|------|-----------|
| Anthropic Blog | RSS | anthropic.com/blog/rss |
| Hacker News | RSS | hnrss.org filtro Claude/Anthropic |
| Dev.to | RSS | dev.to/feed/tag/claude + anthropic + mcp |
| Reddit r/ClaudeAI | RSS | reddit.com/r/ClaudeAI/.rss |
| GitHub Trending | GITHUB | topic:claude, topic:mcp, topic:anthropic |

Altre fonti aggiungibili dall'admin in qualsiasi momento.

## Autenticazione e Sicurezza

- Pagine pubbliche: `/`, `/item/*`, `/ranking/*`
- Pagine protette: `/admin/*` (richiede login)
- API cron protetta con `CRON_SECRET` (header `Authorization`)
- Variabili d'ambiente: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `CRON_SECRET`

## Vincoli e Limiti

- **Piano Vercel richiesto: Pro** (timeout 60s per API route, cron multipli/giorno)
- Pipeline decomposta in 3 step per rispettare il timeout di 60s
- GitHub API: 5000 req/h con token autenticato
- Claude API: costi proporzionali al numero di item da arricchire — max 5 item/ciclo per contenere i costi
- Reddit RSS: best-effort, potrebbe fallire silenziosamente — error handling robusto
