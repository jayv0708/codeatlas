# CodeAtlas — API Design

**Base:** `https://api.codeatlas.app/v1` · **Format:** JSON everywhere (SSE for progress) ·
**Auth:** Bearer JWT (web uses httpOnly cookies; programmatic access via API keys in V4).

Versioned from day one (`/v1`). Breaking changes bump the version — never mutate an existing
version's contract silently.

## 1. Authentication model

- **Access token**: JWT (HS256), 15-minute TTL, claims `{ sub: userId, role }`, signed with
  `JWT_SECRET`. Delivered as an httpOnly, `Secure`, `SameSite=Lax` cookie.
- **Refresh token**: opaque random 256-bit token, stored hashed (SHA-256) in `users`, 30-day TTL,
  rotated on every refresh (old token invalidated). Delivered as an httpOnly cookie with a
  different name. Rotation + reuse detection = stolen-refresh-token defense.
- **Why JWT + refresh instead of sessions in Redis?** Redis stays for queue/rate-limit/cache, and
  JWT keeps auth stateless across API replicas. The short TTL bounds damage if a token leaks.
- CSRF: `SameSite=Lax` + custom `X-Requested-With` header check + JSON-only content types on
  mutating endpoints (state changes never accept `text/plain`).

**Endpoints**

| Method | Path                                    | Body                        | Response                     | Notes                                    |
| ------ | --------------------------------------- | --------------------------- | ---------------------------- | ---------------------------------------- |
| POST   | `/v1/auth/register`                     | `{ email, password, name }` | `201 { user }` + cookies     | password: ≥12 chars, argon2id            |
| POST   | `/v1/auth/login`                        | `{ email, password }`       | `200 { user }` + cookies     |                                          |
| POST   | `/v1/auth/refresh`                      | —                           | `200 { user }` + new cookies | rotates refresh token                    |
| POST   | `/v1/auth/logout`                       | —                           | `204`                        | clears + revokes refresh token           |
| GET    | `/v1/auth/me`                           | —                           | `200 { user }`               | includes `githubConnected: bool`         |
| GET    | `/v1/auth/github/url`                   | —                           | `200 { url }`                | OAuth authorize URL (state = csrf nonce) |
| GET    | `/v1/auth/github/callback?code=&state=` | —                           | `302` to web `/dashboard`    | exchange + connect, sets cookies         |

## 2. Repositories

| Method | Path                             | Body                 | Response                        | Notes                                                                       |
| ------ | -------------------------------- | -------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| POST   | `/v1/repositories`               | `{ githubFullName }` | `202 { repository }`            | validates access via GitHub API, enqueues ingest, returns `status: PENDING` |
| GET    | `/v1/repositories`               | —                    | `200 { repositories[], total }` | dashboard list, sorted by `updated_at`                                      |
| GET    | `/v1/repositories/:id`           | —                    | `200 { repository }`            | includes stats snapshot                                                     |
| DELETE | `/v1/repositories/:id`           | —                    | `204`                           | soft-delete; marks for purge, cancels pending jobs                          |
| POST   | `/v1/repositories/:id/reindex`   | —                    | `202 { repository }`            | force re-ingest (skips unchanged files)                                     |
| GET    | `/v1/repositories/:id/ingestion` | —                    | `SSE`                           | live progress: `{ step, message, done, total }` per stage                   |

**Ingestion stages emitted:** `queued → cloning → scanning → parsing → chunking → embedding →
graphing → ready | failed`. The web UI renders this as a checklist (§9 of spec). SSE closes when
terminal state is reached; clients also poll `/v1/repositories/:id` as a fallback.

## 3. Files & search

| Method | Path                                 | Query                              | Response                                    | Notes                                                                 |
| ------ | ------------------------------------ | ---------------------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| GET    | `/v1/repositories/:id/files`         | `language?`, `q?`, `page`, `limit` | `200 { files[], total }`                    | path prefix filter on `q`                                             |
| GET    | `/v1/repositories/:id/files/:fileId` | —                                  | `200 { file, chunks[] }`                    | full content + chunk line ranges                                      |
| GET    | `/v1/repositories/:id/search`        | `q`, `k=8`                         | `200 { results[] }`                         | pgvector cosine top-k; `results[i] = { file, lines, score, snippet }` |
| GET    | `/v1/repositories/:id/statistics`    | —                                  | `200 { languages, files, chunks, symbols }` | from `stats` snapshot                                                 |

Semantic search is public-facing now because it's cheap and useful; the RAG chat uses the same
retrieval layer internally (`packages/ai`).

## 4. Chat (RAG)

| Method | Path                                 | Body               | Response                  | Notes                                                                |
| ------ | ------------------------------------ | ------------------ | ------------------------- | -------------------------------------------------------------------- |
| POST   | `/v1/repositories/:id/conversations` | `{ title? }`       | `201 { conversation }`    |                                                                      |
| GET    | `/v1/repositories/:id/conversations` | —                  | `200 { conversations[] }` |                                                                      |
| GET    | `/v1/conversations/:id/messages`     | `before?` (cursor) | `200 { messages[] }`      | paginated                                                            |
| POST   | `/v1/conversations/:id/messages`     | `{ content }`      | `200 { message }`         | RAG answer, `content-type: text/event-stream` variant streams tokens |

**Streaming variant** (`Accept: text/event-stream`): events
`{ type: "status", text: "Searching relevant files…" }` → `{ type: "token", text }` →
`{ type: "evidence", citations }` → `{ type: "done", messageId }`. The web chat shows the same
"Analyzing your codebase… / Searching relevant files… / Checking dependencies… / Generating
answer…" states from the spec (§26).

## 5. V2+ feature endpoints (designed now, shipped later)

| Method | Path                                                        | Notes                                                                          |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| GET    | `/v1/repositories/:id/architecture`                         | layered architecture model (frontend → api → services → repositories → db)     |
| POST   | `/v1/repositories/:id/impact`                               | `{ target }` → impact report (direct/indirect dependents, affected APIs/tests) |
| POST   | `/v1/repositories/:id/techdebt`                             | measured indicators + AI interpretation, clearly separated                     |
| POST   | `/v1/repositories/:id/bugdetect`                            | `{ error, stackTrace?, logs? }` → root-cause hypotheses ranked by evidence     |
| GET    | `/v1/repositories/:id/history`, `/issues`, `/pull-requests` | GitHub-data-backed lists + AI summaries                                        |
| POST   | `/v1/repositories/:id/summary`                              | async architecture/onboarding doc generation (job + SSE)                       |

## 6. Error contract

Every error: `{ "error": { "code": "validation_failed", "message": "…", "details": [...] } }`
with correct HTTP status. Canonical codes:

| Code                     | HTTP | When                                                                 |
| ------------------------ | ---- | -------------------------------------------------------------------- |
| `validation_failed`      | 400  | Zod schema failure; `details` lists fields                           |
| `unauthorized`           | 401  | missing/expired token                                                |
| `forbidden`              | 403  | authenticated but not owner of resource                              |
| `not_found`              | 404  | resource missing                                                     |
| `conflict`               | 409  | duplicate repo, reindex already running                              |
| `github_api_error`       | 502  | upstream GitHub failure (with retryable flag)                        |
| `ai_provider_error`      | 502  | Claude/embedding failure (message explains, never exposes key/stack) |
| `rate_limited`           | 429  | per-IP / per-user budget (Retry-After header)                        |
| `repository_not_indexed` | 409  | chat/search before ingestion finished                                |

Validation is centralized: every route declares a Zod schema from `packages/shared`; Fastify
serializes + validates both directions. This is the single source of truth shared with the web
client's types.

## 7. Pagination & conventions

- List endpoints: `page`/`limit` (default 20, max 100) or cursor (`before`) for message history.
- All timestamps ISO-8601 UTC. IDs are UUIDs. Resource URLs are `/{collection}/{id}`.
- Idempotency: `POST /v1/repositories` with same `githubFullName` returns the existing repo (200)
  instead of duplicating; reindex requests while `status ∈ {PENDING,CLONING,…}` return `409`.
