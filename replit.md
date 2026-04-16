# TrueNewsScanner

## Overview

Bulgarian-language scam-check and credibility-check platform. Users can check links, phone numbers, messages, and news for scam/misinformation risk. The product provides evidence-based assessments with 0-100 risk scoring — it does not claim absolute truth.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui (artifacts/truenewsscanner)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (lib/db)
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec in lib/api-spec)
- **Routing**: wouter (frontend)
- **Build**: esbuild (CJS bundle for API)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/truenewsscanner run dev` — run frontend locally

## Pages

- `/` — Начална страница: hero + unified check form (tabs: Линк, Телефон, Съобщение, Новина) + stats
- `/result` — Result page: verdict badge, risk meter, confidence, Bulgarian summary, signals, evidence, next steps
- `/report` — Report page: form to report suspicious content
- `/admin` — Admin panel: report queue, filters, moderation notes, status management
- `/methodology` — Transparency page: explains heuristic signals per content type, AI layer, scoring thresholds
- `/privacy` — Privacy Policy: data collected, retention, user rights, cookies (Bulgarian)
- `/terms` — Terms of Use: service description, liability limits, prohibited use, applicable law (Bulgarian)

## Verdict System

| Verdict | Bulgarian Label | Score Range |
|---------|----------------|-------------|
| safe | По-скоро безопасно | 0-19 |
| insufficient | Недостатъчно данни | 20-39 |
| suspicious | Съмнително | 40-59 |
| misleading | Подвеждащо / висок риск | 60-79 |
| scam | Вероятно измама | 80-100 |

## Pipeline Architecture

Mock pipelines in `artifacts/api-server/src/lib/pipeline/`:
- `url.ts` — URL checker (TODO: Google Web Risk, RDAP, urlscan.io)
- `phone.ts` — Phone checker (TODO: Twilio Lookup)
- `message.ts` — Message checker (TODO: NLP classifier for Bulgarian)
- `news.ts` — News checker (TODO: Google Fact Check Tools API, factcheck.bg)

## Database Schema

- `checks` — stores all check requests and results
- `reports` — stores community reports with moderation status

## API Routes

- `POST /api/check` — submit content for checking
- `GET /api/checks/recent` — stats for homepage
- `POST /api/report` — submit community report
- `GET /api/admin/reports` — list reports (with filters)
- `GET /api/admin/reports/:id` — get single report
- `PATCH /api/admin/reports/:id` — update report (notes, status)
- `GET /api/admin/stats` — admin dashboard stats

## WordPress Integration

Two WordPress-ready files are in the `wordpress/` directory:

- **`wordpress/truenewsscanner.php`** — WordPress plugin. Upload to `wp-content/plugins/` and activate. Then use shortcode `[truenewsscanner]` on any page or post.
  - Shortcode options: `[truenewsscanner height="800"]`, `[truenewsscanner tab="message"]`, `[truenewsscanner url="https://your-url"]`
  - Includes a Settings page under WordPress Admin > Settings > TrueNewsScanner
- **`wordpress/embed-snippet.html`** — Plain iframe embed code. Paste into any HTML block, theme editor, or website builder.

## AI Integration (OpenAI)

All 4 check pipelines (URL, phone, message, news) now use OpenAI `gpt-5-nano` for real AI-powered analysis in Bulgarian.
- Charges billed to Replit AI credits (no OpenAI API key needed)
- Automatic fallback to regex-based analysis if AI is unavailable
- 25-second timeout per AI call before fallback kicks in
- Model: `gpt-5-nano` (fastest, optimized for high-volume tasks)

## Future Integrations (TODOs)

- Google Web Risk API (URL safety)
- RDAP (domain registration lookup)
- urlscan.io (URL threat analysis)
- Twilio Lookup (phone number analysis)
- Google Fact Check Tools API (news verification)
- factcheck.bg integration (Bulgarian fact-checking)
- Bulgarian NLP classifier for scam SMS/messages
- PostgreSQL: upgrade from in-process to Redis for session/caching
