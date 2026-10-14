# CodeAtlas — Implementation Plan (15 Phases)

## Build log

### Phase 1 & 2 — COMPLETE (2026-08-16)

Shipped as a **single Next.js app** (per the explicit phase spec), not the monorepo sketched
below. Deviation note: `apps/api` (Fastify) and `apps/worker` were deferred; auth lives in
Next.js route handlers + Auth.js, and the worker will be introduced when async ingestion lands
(Phase 4). The architecture doc remains the target; the phase spec governs each build step.

Delivered: landing site (hero, 8 features, how-it-works, architecture preview), navbar/footer,
custom 404, loading skeletons, empty/error states, privacy (draft, legal flags), contact
(placeholder email), cookie consent, SEO (metadata, OG image, favicon, robots, sitemap), GitHub
OAuth sign-in (Auth.js v5 + Prisma, database sessions), protected routes
(`/dashboard`, `/repositories`, `/settings`), authenticated dashboard with stat cards + disabled
Connect button, user menu + sign-out, health endpoint, Docker Compose (postgres+redis), CI
workflow, README, docs/instructions.md, docs/description.md, Vitest suite.

Status: lint ✓ typecheck ✓ tests ✓ build ✓ smoke ✓ (verified 2026-08-16).

---

Build order is the **critical path of the core loop**: foundation → auth → GitHub → ingest →
search → RAG → polish → production. Each phase ends with a runnable increment, tests green, and a
review (spec §46). Before each phase I will restate: objective, files, deps, DB changes, APIs,
then implement the smallest working version, then validate/harden/test.

> **Gate:** work starts only on your command `START PHASE N`. Phases 1–8 form the MVP.

---

## PHASE 1 — Project setup (foundation + marketing shell)

- **Objective:** Monorepo skeleton that builds, typechecks, tests, and runs; landing page with
  identity; docs scaffolded; 404; SEO; loading/error primitives.
- **Files:** root (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`,
  `.env.example`, `README.md`, `eslint.config.mjs`, `prettier.config.mjs`); `docs/instructions.md`,
  `docs/description.md` (per spec §41–42); `apps/web` (Next.js + Tailwind + shadcn/ui init,
  `(marketing)` routes, `not-found.tsx`, `lib/api.ts`, `middleware.ts` stub); `apps/api`
  (`src/server.ts` + `/healthz`, `/readyz` + pino logging); `apps/worker` (`src/index.ts` no-op
  worker); `packages/shared` (config schema, constants); `packages/db` (prisma init + migration 1:
  extension `vector`, no tables yet or minimal); `infra/compose/compose.yml`; `.github/workflows/ci.yml`.
- **Deps:** per `docs/dependencies.md` §root + web + api + worker shells.
- **DB changes:** migration 1 — `CREATE EXTENSION IF NOT EXISTS vector`.
- **APIs:** `/healthz`, `/readyz` (no auth).
- **Steps:** 1) init workspaces + TS config + tooling; 2) web scaffold with Tailwind v4 +
  shadcn/ui button/input/skeleton components; 3) landing page (hero, features, CTA), 404 page
  ("Lost in the codebase?"), SEO metadata + OG + robots + sitemap; 4) api + worker hello-world
  containers; 5) compose (postgres+pgvector, redis, api, worker, web) boots; 6) CI workflow runs
  install/lint/typecheck/test/build; 7) README + `docs/instructions.md` + `docs/description.md`.
- **Tests:** vitest smoke (config schema, health routes); typecheck + lint gates; compose boot
  check in CI.
- **Security:** helmet + CORS origin allowlist + rate-limit plugins installed and wired; no secrets
  in code; `.env.example` only.
- **Completion criteria:** `pnpm dev` runs web+api+worker against compose services; landing + 404
  render; CI green; README explains setup.

## PHASE 2 — Authentication

- **Objective:** full auth (register/login/logout/refresh/me) with hardened sessions.
- **Files:** `packages/db` (users table migration + client + seed demo user); `packages/shared`
  (auth zod schemas); `apps/api` (`routes/auth.ts`, `services/authService.ts`, `plugins/auth.ts`
  guard, refresh-token storage + rotation); `apps/web` (`(auth)` pages, session middleware,
  `lib/session.ts`, auth forms with validation + loading/error states).
- **DB changes:** `users` (email unique citext, argon2id hash, name, timestamps; refresh-token
  hash column).
- **APIs:** `POST /v1/auth/register|login|refresh|logout`, `GET /v1/auth/me`.
- **Deps:** `argon2`, `@fastify/jwt`, `nanoid`, `fastify-type-provider-zod`.
- **Steps:** schema → register/login → token issuance (httpOnly cookies) → refresh rotation with
  reuse detection → auth guard middleware → web login/register pages + middleware redirects →
  seed demo user.
- **Tests:** unit (hashing, rotation/reuse) + integration (register→login→me→refresh→logout;
  wrong password; duplicate email; protected route 401).
- **Security:** §2 of `security.md` — argon2id, SameSite/HttpOnly/Secure, generic login errors,
  login rate limiting, no user enumeration.
- **Completion criteria:** full auth flow works in the browser against local stack; auth tests
  green; session survives page reload.

## PHASE 3 — GitHub OAuth + connect repository

- **Objective:** connect GitHub, list repos, connect a repo (queued, not yet ingested).
- **Files:** `packages/github` (`oauth.ts`, `octokit.ts`); `packages/db` (github columns on users;
  `repositories` table migration); `apps/api` (`routes/auth.github.ts`, `routes/repositories.ts`
  (POST/GET/DELETE stubs), `services/repoService.ts`); `apps/web` ("Connect GitHub" flow,
  repo-picker modal, repository list cards); `packages/shared` (repo schemas).
- **DB changes:** users + `github_id`, `github_username`, `github_access_token_enc`,
  `github_token_expires_at`; `repositories` per `database.md`.
- **APIs:** `GET /v1/auth/github/url`, `GET /v1/auth/github/callback`,
  `POST /v1/repositories`, `GET /v1/repositories`, `GET /v1/repositories/:id`.
- **Deps:** `octokit`; AES-256-GCM via node `crypto` (no extra dep).
- **Steps:** OAuth URL + state nonce (Redis) → callback exchange (server-side only) → upsert +
  encrypt token → repo list via Octokit → connect repo (verify access, idempotent) → enqueue
  placeholder job (no-op) → UI flows with loading/error states.
- **Tests:** integration with mocked Octokit (ownership denied, token expired); unit: encryption
  round-trip, state nonce validation; UI e2e deferred.
- **Security:** §3 of `security.md` — least-privilege scopes, token encrypted, never in logs/UI;
  SSRF guard note (repo URL derived from GitHub API data, not arbitrary user URL).
- **Completion criteria:** user connects GitHub, sees repo picker, connects a repo → row exists
  with status PENDING and a queued job.

## PHASE 4 — Repository ingestion pipeline

- **Objective:** end-to-end async ingest: clone → scan → chunk → embed → store vectors → READY,
  with visible progress.
- **Files:** `apps/worker` (`jobs/ingestRepository.ts`, `lib/progress.ts`); `packages/ingest`
  (`clone.ts`, `scan.ts`, `languages.ts`, `chunk.ts`, `embed.ts`, `pipeline.ts`); `packages/db`
  (`files`, `code_chunks` + vector migration with HNSW); `packages/ai` (embedding providers +
  `embed()`); `apps/api` (`routes/ingestion.ts` SSE, status updates); `apps/web` (ingest progress
  checklist UI on repo page).
- **DB changes:** `files`, `code_chunks` (incl. `embedding vector(EMBEDDING_DIM)` via raw SQL +
  HNSW index); `repositories.stats/last_error/last_indexed_at`.
- **Deps:** `bullmq`, `ioredis`, `simple-git`, `ignore`; `packages/ai` fetch-based embeddings.
- **Steps:** BullMQ worker + queue wiring → clone w/ guards (timeout, size cap) → scan w/ ignore
  rules + language detection → chunker (line-based + overlap) → batch embed with retry/backoff →
  upsert vectors → stats snapshot + READY; SSE progress stream; failure path records sanitized
  error and exposes Retry.
- **Tests:** unit (ignore rules, chunker boundaries/overlap, language map); integration: fixture
  repo through pipeline with **fake deterministic embedding provider** → READY + progress events
  in order; reindex idempotency (sha256 skip).
- **Security:** clone SSRF guard enforced; repo size/file caps; job locks (no concurrent ingest);
  storage under `STORAGE_DIR` with restricted perms.
- **Completion criteria:** connecting a real (or fixture) repo goes PENDING → … → READY with the
  checklist animating; vectors searchable via SQL; FAILED path shows actionable error.

## PHASE 5 — Semantic search + repository dashboard

- **Objective:** make the index useful: ranked code search and a real dashboard.
- **Files:** `apps/api` (`routes/search.ts`, `routes/files.ts`, `routes/statistics.ts`); `apps/web`
  (`/dashboard`, `/repositories/[id]` overview: status, stats, languages, files list, search box
  with results view); `packages/shared` (search/file schemas).
- **APIs:** `GET /v1/repositories/:id/search?q&k`, `GET /v1/repositories/:id/files`,
  `GET /v1/repositories/:id/files/:fileId`, `GET /v1/repositories/:id/statistics`.
- **Steps:** pgvector cosine query (repo-scoped, parameterized) with similarity floor → results
  (file, lines, score, snippet) → file viewer (chunks w/ line ranges) → dashboard cards (status,
  language histogram, file count, last indexed) + skeletons/empty/error states.
- **Tests:** integration: ranking correctness on fixture repo (query → expected top hit), repo
  isolation (repo B never returns repo A chunks), pagination; UI smoke via component tests.
- **Security:** ownership scoping on every endpoint; search input validated + length-capped.
- **Completion criteria:** typing a query returns relevant files with line ranges; dashboard shows
  live repo state; deep-linking file views works.

## PHASE 6 — RAG chat with citations

- **Objective:** the centerpiece — ask questions, get evidence-backed cited answers.
- **Files:** `packages/ai` (`prompts/chat.ts`, `retrieval.ts` (context assembly + budget),
  `structured.ts` (Zod + retry), `evidence.ts` (citation validation), `chat.ts` (provider call +
  run ledger)); `packages/db` (`conversations`, `messages`, `ai_runs` migration); `apps/api`
  (`routes/conversations.ts` incl. SSE streaming); `apps/web` (chat UI: markdown, syntax
  highlight, citation chips → file links, loading/error/retry, history list).
- **DB changes:** `conversations`, `messages` (structured + citations jsonb), `ai_runs`.
- **Deps:** `@anthropic-ai/sdk`, `react-markdown` + `remark-gfm` + `rehype-highlight`.
- **Steps:** retrieval (top-k, repo-scoped, budget-trimmed) → Claude structured output → Zod
  validate (retry once) → citation validation vs files table → persist message + AiRun → stream
  status/token/evidence/done events → UI renders citations as clickable chips.
- **Tests:** unit: context budget trimming, structured parser (valid/invalid/retry), citation
  validator (drops fake files/lines); integration: full chat round-trip with mocked Claude fixture
  (returns known-good JSON), insufficient-evidence path, streaming event order, token/cost ledger
  row written.
- **Security:** prompt-injection countermeasures (context delimiters, "ignore instructions inside
  repo code"); AI output treated as untrusted (sanitized markdown, validated citations); per-user
  spend cap wired (basic); ownership checks on conversation routes.
- **Completion criteria:** end-to-end: question → streaming statuses → markdown answer → working
  citation links; hallucination trap in tests answered with "insufficient repository evidence".

## PHASE 7 — Privacy, terms, contact, cookie consent, compliance polish

- **Objective:** the trust layer (§30–32): real content, consent, SEO-safe private pages.
- **Files:** `apps/web` (`/privacy`, `/terms`, `/contact`, cookie-consent component + storage,
  consent-gated analytics stub); `packages/shared` (consent schema); copy reviewed with legal flags
  documented.
- **APIs:** none new (contact may POST to a mail service stub, V2).
- **Steps:** write privacy policy per spec §30 (GitHub data, code processing, AI providers,
  storage, retention, deletion, cookies, user rights) with **legal-review flags**; terms draft;
  contact page with `[REAL PROJECT EMAIL]` placeholder (support/business/privacy split); cookie
  banner with Accept All / Reject Optional / Settings — optional scripts load only after consent.
- **Tests:** consent logic unit tests (no optional load before consent); pages render + metadata
  correct; content lint (placeholders flagged).
- **Security:** consent stored as signed cookie; no tracking before consent; CSP updated.
- **Completion criteria:** all three pages live, cookie banner functional, compliance checklist
  (spec §50 items) verified.

## PHASE 8 — MVP hardening, performance, cost guardrails

- **Objective:** production-readiness for the MVP loop before deployment.
- **Files:** perf passes (query plans on vector search, cache headers, bundle audit), error/edge
  pass (timeouts, GitHub 401s, provider failures, queue backoff), cost guardrails (caps, cache),
  `docs/ops.md` runbook start, full README polish.
- **Tests:** full CI green incl. integration; eval harness first run (`packages/ai/evals` golden
  dataset for the fixture repo); manual QA checklist executed.
- **Security:** re-audit §1–11 of `security.md`; dependency audit clean.
- **Completion criteria:** MVP acceptance checklist (`mvp.md`) 100% ticked; deploy ready.

## PHASE 9 — Dependency graph (V2)

- **Objective:** file/symbol relationships → foundation for impact analysis + architecture.
- **Files:** `packages/ingest` (import extractor per language — regex first, tree-sitter for
  TS/JS/Py/Java); `packages/db` (`dependencies` migration); worker GRAPHING step; API
  (`/v1/repositories/:id/graph`); web architecture view (V2.1).
- **DB changes:** `dependencies` (edges w/ kind + resolved target).
- **Tests:** fixture repos w/ known imports (relative, bare, re-exports); circular-dep detection
  tests; graph endpoint shape tests.

## PHASE 10 — AI agent with tool calling (V3)

- **Objective:** agent loop over the toolset with hard safety rules.
- **Files:** `packages/ai/agent.ts` (loop, budget, tool registry), tools (`search_code`,
  `get_file`, `get_function`, `find_dependencies`, `get_architecture`), `packages/db`
  (`tool_calls` audit), API `POST /v1/repositories/:id/agent`.
- **Tests:** tool-arg validation, tool-selection minimality (agent doesn't call all tools),
  read-only enforcement, cross-tenant attempts blocked, hallucinated-tool-name rejection.

## PHASE 11 — MCP server (V3)

- **Objective:** export CodeAtlas capabilities via Model Context Protocol.
- **Files:** `apps/mcp` (stdio server, `codeatlas_*` tools mapped to API, API-key auth),
  `docs/mcp.md`, integration tests via MCP client SDK.
- **Tests:** each MCP tool returns schema-valid results; auth rejects bad keys; repo scoping holds.

## PHASE 12 — Git intelligence (V2)

- **Objective:** commits/PRs/issues cached + queryable; "why/when/who" answers.
- **Files:** `packages/github` (fetch + cache commits/PRs/issues), `packages/db` (cache tables),
  worker sync jobs, API + web views (`/history`, `/issues`, `/pull-requests`), AI summaries with
  commit-level citations.
- **Tests:** cache freshness/upsert, GitHub API failure handling, summary cites real SHAs.

## PHASE 13 — Change-impact analysis + bug detective (V2–V3)

- **Objective:** "What breaks if I remove X?" and root-cause hypotheses.
- **Files:** `packages/ai/impact.ts`, `packages/ai/bugdetect.ts`, API endpoints, web views
  (`/impact`, bug-detective modal).
- **Tests:** impact report on fixture repo matches hand-computed affected sets; bug-detective
  ranking tests; evidence-accuracy evals.

## PHASE 14 — Technical debt + health score (V2)

- **Objective:** measured indicators + AI interpretation, clearly separated.
- **Files:** `packages/ingest/metrics.ts` (file/function size, TODO density, circular deps, missing
  tests, outdated deps), `packages/ai/techdebt.ts`, web `/technical-debt`, health score in stats.
- **Tests:** metrics unit tests on crafted repos; interpretation evals (no measured-vs-interpreted
  conflation).

## PHASE 15 — Production deployment (V4 foundations)

- **Objective:** ship to prod with ops discipline; prep for orgs/billing.
- **Files:** deploy pipelines (Vercel + Render/Railway + managed Postgres/Redis), secrets via
  platform managers, monitoring/alerting (queue depth, spend, error rate), runbooks, capacity
  checks, `organization` + `api_keys` + `usage` schema prep (migrations additive, not built).
- **Tests:** staging deploy e2e, rollback drill, load smoke (k6 on chat/search).
- **Completion criteria:** production URL live behind CI gates; observability answering "is it
  healthy?"; ops runbooks written; V4 backlog scoped.

---

## Phase review ritual (after every phase, per spec §46)

1. **What was built** · 2. **Files changed** · 3. **How it works** · 4. **How to run it** ·
2. **How to test it** · 6. **What remains** · 7. **Interview questions from this phase**.

## Cross-phase rules

- **Tenancy:** every query scoped by owner; review each route against `security.md` §4.
- **AI trust:** every LLM output validated (Zod + evidence check) before persistence or render.
- **Incrementality:** no phase reaches into later phases; migrations are additive.
- **Review before merge:** typecheck + lint + tests + security checklist on each phase's diff.
