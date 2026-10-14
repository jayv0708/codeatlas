# CodeAtlas — Testing Strategy

Testing pyramid: **unit tests (many, fast) → integration tests (API + DB + Redis) → AI
evaluation (the special sauce) → E2E (few, critical paths).** Every layer runs in CI
(`.github/workflows/ci.yml`); AI evals are a separate scheduled workflow (slow, costs tokens).

## 1. Unit tests (Vitest)

| Area              | What we test                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ingest` | ignore rules, language detection, chunker (line ranges, overlap, symbol anchoring), incremental sha256 logic, size caps                                                                  |
| `packages/shared` | Zod schemas reject/pass fixtures, constants                                                                                                                                              |
| `packages/ai`     | prompt builders (context assembly, budget trimming), structured-output parser (valid/invalid JSON, retry-once), citation validator (drops nonexistent files/lines), rate-table cost math |
| `apps/api`        | auth service (hash/verify, token rotation, reuse detection), pagination helpers, error mapping                                                                                           |
| `apps/worker`     | job state machine transitions, progress writer                                                                                                                                           |

Golden tests for prompts: assert the rendered system prompt contains the rules and that repo
content cannot break out of `<context>` delimiters.

## 2. Integration tests (Vitest + testcontainers or compose)

- Boot Postgres+pgvector and Redis via docker compose (CI service containers).
- **API tests** (Fastify `inject`): register/login/refresh/logout; repo CRUD with ownership
  checks (user B cannot read user A's repo — this is the highest-value test); validation failures
  return the contract shape.
- **DB tests:** vector upsert + cosine search returns correct ranking with a small embedded
  fixture; repo-scoped filter excludes other repos; HNSW index works (smoke).
- **Ingestion tests:** a fixture repo (small TS/Py files) goes through clone→scan→chunk→embed
  (embedding mocked to a deterministic fake) → READY, with progress events emitted in order.
- **Chat tests:** mocked chat provider; message endpoint returns validated structured answer +
  citations that exist in the fixture repo; streaming variant emits the event sequence.

**Mock strategy:** all provider boundaries are interfaces (`packages/ai`) — integration tests use
a fake `EmbeddingProvider` (e.g. hash-based deterministic vectors) so tests never hit the network.

## 3. AI evaluation harness (`packages/ai/evals` — §39 of spec)

The core promise is _evidence-backed answers_, so we measure it, not hope for it.

**Golden dataset:** `packages/ai/evals/dataset/*.json` — realistic repository questions per fixture
repo, with expected answer facts, expected evidence files, and hallucination traps (questions
about nonexistent APIs). Seeded from real public repos.

**Metrics per run:**

- Retrieval: hit-rate@k (expected files in top-k), mean reciprocal rank.
- Answer: factual correctness (LLM-as-judge with a rubric + human spot-check), evidence accuracy
  (% citations that reference real lines), hallucination rate (% answers claiming nonexistent
  facts), JSON validity, latency p50/p95, cost per answer.

**Runs:** nightly CI cron + on-demand `pnpm eval` for prompt/model changes. Reports written to
`evals/reports/*.md`. Any prompt change without eval coverage is rejected in review.

## 4. E2E (Playwright, V2+)

Critical paths only: register → connect repo → see ingest progress → ask a question → see cited
answer; 404 page; cookie consent. Runs against a seeded staging environment in CI.

## 5. Test data & isolation

- `packages/db/seed.ts`: demo user + fixture repo (deterministic).
- Each integration test transaction-wrapped or DB-recreated (fast: truncate + seed per suite).
- Never run tests against prod data; CI uses ephemeral containers; local uses
  `DATABASE_URL_TEST` / separate Redis DB.

## 6. CI gate (what must pass to deploy)

```
install (pnpm install --frozen-lockfile)
→ lint (eslint flat config, no warnings)
→ typecheck (tsc --noEmit, all workspaces)
→ unit tests
→ integration tests (compose services)
→ build (web export + api/worker container build)
→ audit (pnpm audit --prod)
[deploy only after all green; evals are informational, scheduled separately]
```

## 7. What we deliberately do NOT test in MVP

- Full tree-sitter parse correctness across all languages (V2 with per-language fixtures).
- Visual regression (add when design system stabilizes).
- Load/perf (add before public launch: k6 smoke on chat + search).
