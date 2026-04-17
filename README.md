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
- E2E: `npm run test:e2e`
