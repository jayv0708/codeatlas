# CodeAtlas — AI Intelligence Layer for Software Systems

Understand your entire software system with AI. CodeAtlas connects to a GitHub repository,
builds a persistent intelligence layer over it — code, architecture, dependencies, and Git history
— so you can ask questions in plain English and get **evidence-backed answers with citations**.

---

## Features

- **Landing page** — Professional dark-themed design (Stitch) with animated hero, features, data flow, and CTA
- **Authentication** — GitHub + Google OAuth with secure database-backed sessions (Auth.js v5)
- **Dashboard** — Command center with system health metrics, integrations, and AI insights
- **Repository Connection** — Connect GitHub repositories with real-time indexing progress
- **Codebase Chat** — Ask questions about your code, get evidence-backed answers via Gemini/Claude AI
- **Architecture** — Dependency graph visualization with component search and impact analysis
- **Impact Analysis** — Understand what breaks when you change a component
- **AI Insights** — Largest files, dependency hotspots, language distribution, symbol analysis
- **Documentation** — Built-in docs covering setup, features, security, and architecture
- **Settings** — Profile, AI provider configuration, and account management

## Tech stack

| Layer    | Choice |
| -------- | ------ |
| Frontend | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 |
| Auth     | Auth.js v5 (NextAuth) · GitHub OAuth · Google OAuth · Prisma adapter |
| Database | PostgreSQL 16+ with pgvector · Prisma 6 |
| AI       | Gemini (default) · Claude · Ollama (local) |
| Quality  | ESLint 9 · Prettier · Vitest + Testing Library |
| Infra    | Docker Compose · GitHub Actions CI |

## Local setup

Requirements: Node 20.9+ (Node 22 recommended), pnpm 10, PostgreSQL (or Docker).

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local   # then fill in values (see below)

# 3. Start PostgreSQL
docker compose -f infra/compose/compose.yml up -d postgres

# 4. Apply migrations
pnpm db:generate
pnpm db:migrate

# 5. Run
pnpm dev                    # http://localhost:3000
```

## Environment variables

See [`.env.example`](.env.example) for all variables. Required:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (with pgvector) |
| `AUTH_SECRET` | Auth.js session signing key — `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth App credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GEMINI_API_KEY` | Google AI API key (for codebase chat) |

Optional: `AI_PROVIDER` (gemini/claude/ollama), `ANTHROPIC_API_KEY`, `OLLAMA_BASE_URL`.

## GitHub OAuth setup

1. Go to https://github.com/settings/developers → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env.local`
5. The app requests `repo` scope for private repository access

## Google OAuth setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Set Authorized redirect URI to `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Client Secret to `.env.local`

## Docker

```bash
# Infrastructure only (PostgreSQL + Redis)
docker compose -f infra/compose/compose.yml up -d

# Full stack (app + database)
docker compose -f infra/compose/compose.yml --profile full up -d
```

## Testing

```bash
pnpm test            # Vitest (unit + integration)
pnpm lint            # ESLint
pnpm typecheck       # TypeScript
pnpm build           # Production build
```

## Project structure

```
app/                    Next.js App Router (marketing, dashboard, API routes)
components/             React components (ui, dashboard, chat, architecture, etc.)
lib/                    Utilities, AI providers, ingestion, rate limiting
services/               Auth.js, database (Prisma client)
prisma/                 Schema + migrations
tests/                  Unit + integration tests
docs/                   Documentation
infra/                  Docker compose
```

## Deployment

See [`docs/deployment.md`](docs/deployment.md) for full deployment instructions including
Vercel, Docker, and self-hosted options.

## License

Private — CodeAtlas
