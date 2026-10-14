# CodeAtlas — Final Architecture

## 1. System overview

```
                        ┌────────────────────────────────────────────────────────┐
                        │                        Client                          │
                        │   Next.js web app (Vercel)  +  API consumers (V3+)     │
                        └──────────────┬───────────────────────────┬─────────────┘
                                       │ HTTPS                     │ HTTPS (JSON/SSE)
                                       ▼                           ▼
        ┌──────────────────────────────┴────────────────────────────────────────┐
        │                      apps/api  — Fastify 5 REST service                │
        │   auth · repositories · files · search · chat (RAG) · ingestion API    │
        └───┬───────────────┬───────────────────┬──────────────────────┬─────────┘
            │               │                   │                      │
            ▼               ▼                   ▼                      ▼
   ┌───────────────┐  ┌────────────┐   ┌────────────────┐    ┌─────────────────┐
   │  PostgreSQL   │  │   Redis    │   │  apps/worker    │    │  Claude (Anthropic)│
   │  16 + pgvector│  │  BullMQ    │   │  (BullMQ consumer)│  │  + embedding API  │
   │  app data +   │  │  cache,    │   │  clone → parse → │    │  (Voyage / Ollama)│
   │  embeddings   │  │  rate-limit│   │  chunk → embed   │    └─────────────────┘
   └───────────────┘  └────────────┘   └────────────────┘
            ▲
            │ (background: GitHub API, webhooks V2)
   ┌────────┴───────────────┐
   │  GitHub (repos, API,   │
   │  OAuth, webhooks)      │
   └────────────────────────┘
```

**Three processes, one codebase (pnpm monorepo):**

| Process                | Responsibility                                                                  | Why separate?                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/web` (Next.js)   | Marketing pages, dashboard UI, chat UI, auth pages                              | UI needs SSR/SEO; private dashboards must stay out of search indexes                                     |
| `apps/api` (Fastify)   | All JSON APIs: auth, repos, files, semantic search, RAG chat, ingestion control | The API is a product surface (webhooks, API keys in V4). Keeps business logic testable without a browser |
| `apps/worker` (BullMQ) | Async ingestion pipeline: clone → parse → chunk → embed → store → graph         | Ingestion can take minutes for large repos — never run it inside an HTTP request                         |

**Why not one Next.js app doing everything?** Route handlers would couple long-running work to
request lifecycles and make background processing, webhooks, and a future public API awkward.
The split costs a little infrastructure and pays back in testability and scale. Every technology
here solves a real problem (§52): Postgres stores data **and** vectors (no separate vector DB),
Redis powers the job queue **and** rate limiting **and** caching, Claude reasons over retrieved
context, RAG keeps context small and costs bounded.

## 2. Core data flows

### 2.1 Connect & ingest (async)

```
User clicks "Connect repository" (web)
  → POST /v1/repositories { githubFullName }
  → api validates ownership via GitHub token, enqueues BullMQ job `ingest:{repoId}`
  → api returns 202 { repository } (status: PENDING)
  → worker:
      CLONING   clone (shallow) to durable storage   ─┐
      SCANNING  walk tree, apply ignore rules          │ each step writes progress
      PARSING   detect language, extract symbols (V2)  │ to Redis `ingest:{id}:progress`
      CHUNKING  semantic chunks w/ symbol context      │ and streams to UI via SSE
      EMBEDDING batch-embed, upsert vectors ───────────┘
      GRAPHING  build dependency edges (V2)
      FINAL     status=READY, stats snapshot
  → web polls GET /v1/repositories/:id/ingestion (SSE) and renders progress checklist
```

### 2.2 Ask a question (RAG chat)

```
User asks "What happens if I remove UserService?" (web)
  → POST /v1/conversations/:id/messages
  → api: embed query → pgvector top-k search (repo-scoped) → optional keyword hybrid (V2)
       → assemble context under token budget → Claude with system prompt + structured output
       → zod-validate the structured answer → validate citations against files table
       → persist Message + AiRun (token/cost/latency) → return { answer, confidence, evidence }
  → web renders markdown + citation chips (click → file view)
```

### 2.3 GitHub OAuth

See [`github-integration.md`](./github-integration.md) §1. Token is exchanged server-side,
encrypted with AES-256-GCM, and **never** sent to the browser.

## 3. Folder structure (final)

```
codeatlas/
├─ apps/
│  ├─ web/                        # Next.js 15 App Router
│  │  ├─ app/
│  │  │  ├─ (marketing)/          # landing, /privacy, /terms, /contact, /404
│  │  │  ├─ (auth)/login, /register
│  │  │  └─ (app)/                # authenticated shell (redirect if no session)
│  │  │     ├─ dashboard/
│  │  │     ├─ repositories/[id]/ # overview, chat, files, search
│  │  │     ├─ repositories/[id]/{architecture,history,issues,pull-requests,impact,technical-debt}/   # V2+
│  │  │     └─ settings/
│  │  ├─ components/              # ui/ (shadcn primitives), chat/, dashboard/, repo/
│  │  ├─ lib/                     # api client, auth helpers, formatting
│  │  └─ middleware.ts            # session guard, cookie consent
│  ├─ api/                        # Fastify 5
│  │  ├─ src/
│  │  │  ├─ server.ts             # build + start
│  │  │  ├─ plugins/              # jwt, cors, helmet, rate-limit, error handler, auth guard
│  │  │  ├─ routes/               # auth.ts, repositories.ts, files.ts, search.ts, conversations.ts, ingestion.ts
│  │  │  ├─ services/             # authService, repoService, chatService, ingestService
│  │  │  └─ lib/                  # sse.ts, errors.ts, pagination.ts
│  │  └─ test/
│  └─ worker/
│     ├─ src/
│     │  ├─ index.ts              # BullMQ worker(s)
│     │  ├─ jobs/ingestRepository.ts
│     │  └─ lib/progress.ts       # Redis progress writer
│     └─ test/
├─ packages/
│  ├─ shared/                     # zod schemas + TS types + constants (web ↔ api contract)
│  ├─ db/                         # prisma/schema.prisma, migrations/, src/client.ts, src/seed.ts
│  ├─ ai/                         # providers (anthropic, openai-compatible), prompts/, structured output, retrieval/, evals/
│  ├─ ingest/                     # clone.ts, scan.ts, language.ts, parse/, chunk.ts, embed.ts, pipeline.ts
│  └─ github/                     # oauth.ts, octokit.ts, webhooks.ts
├─ infra/
│  ├─ docker/                     # api.Dockerfile, worker.Dockerfile, web.Dockerfile
│  └─ compose/compose.yml         # postgres+pgvector, redis, api, worker, web
├─ docs/                          # this design package
├─ .github/workflows/ci.yml
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ .env.example
└─ package.json                   # root scripts: dev, build, typecheck, test, lint
```

## 4. Cross-cutting concerns

- **Config**: all secrets via environment variables; `packages/shared` exports a single Zod-validated
  config schema loaded at boot (fail fast on missing vars).
- **Observability**: structured JSON logs (pino) with request IDs; `AiRun` rows record model,
  tokens, cost estimate, latency per AI call; ingestion progress in Redis; health endpoints
  (`/healthz`, `/readyz`).
- **Errors**: typed error envelope `{ error: { code, message, details? } }`; no stack traces to
  clients; AI/provider errors mapped to actionable messages.
- **Caching**: Redis — rate-limit counters, chat response cache (exact-duplicate question +
  same repo, short TTL), ingestion progress, dashboard stats snapshot.
- **Tenancy**: every query scoped by `repository.user_id` (MVP) → org scoping in V4. Never trust a
  client-supplied id alone.

## 5. Deployment architecture (summary — details in `deployment.md`)

| Component             | Dev (local)              | Prod (initial)                | Prod (scale)                      |
| --------------------- | ------------------------ | ----------------------------- | --------------------------------- |
| Web                   | `pnpm dev` (Next)        | Vercel                        | Vercel + edge caching             |
| API                   | container (Fastify)      | Docker on Render/Railway      | container on Fly/K8s, ≥2 replicas |
| Worker                | container                | Docker, 1+ replica, retries   | autoscaled by queue depth         |
| Postgres+pgvector     | `pgvector/pgvector:pg16` | managed (Neon/Supabase/RDS)   | managed + read replica            |
| Redis                 | `redis:7`                | managed (Upstash/Redis Cloud) | managed cluster                   |
| Storage (repo clones) | `data/` volume           | managed S3-compatible         | S3                                |

CI (GitHub Actions) gates every deploy: install → lint → typecheck → unit/integration tests →
build. Secrets injected per environment; no secrets in the repo.
