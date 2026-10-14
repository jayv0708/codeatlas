# CodeAtlas — GitHub Integration & Repository Ingestion

## 1. GitHub OAuth flow (web application flow, OAuth App)

**Why an OAuth App and not a GitHub App?** OAuth App = simplest correct path for "user connects
their own repositories" in the MVP: one token, classic web flow, no app-installation webhook
plumbing. GitHub App (installation-based, fine-grained permissions, per-repo webhooks) is the V4
upgrade path for team workspaces and private-repo-by-installation UX — the token/scope model in the
schema is compatible with either.

```
1. GET /v1/auth/github/url
   → api generates state nonce (random, stored in Redis, 10 min TTL)
   → redirect: github.com/login/oauth/authorize
       client_id, scope=repo%20read:user, state
       (repo scope needed to read private repos the user grants; we request nothing more)

2. GitHub shows consent → redirects to /v1/auth/github/callback?code&state

3. api verifies state against Redis (CSRF protection)
   → POST github.com/login/oauth/access_token { code, client_id, client_secret }   (server-side)
   → GET api.github.com/user with token
   → upsert user (link github_id to logged-in user or auto-register), encrypt token
     (AES-256-GCM, ENCRYPTION_KEY), store expires_at (GitHub tokens don't refresh — re-consent
     flow on 401)
   → set auth cookies, 302 → web /dashboard?connected=1
```

- The `code` exchange and `client_secret` **never** touch the browser or the Next.js server —
  they stay in `apps/api` (SSR server would leak into client bundles if careless).
- Least privilege: `repo` + `read:user` only. No `admin:org`, no `delete_repo`.
- Token expiry/revocation: any 401 from GitHub triggers `github_token_revoked` → UI prompts
  "Reconnect GitHub" (silent re-auth attempt first).

## 2. Connecting a repository

- Web sends `POST /v1/repositories { githubFullName: "owner/name" }`.
- api checks with the user's GitHub token (`GET /repos/{full_name}`) that the user can access it —
  never trusts the client about ownership.
- Creates `repositories` row (status `PENDING`) → enqueues BullMQ `ingest:{repoId}` → `202`.

## 3. Ingestion pipeline (async, in `apps/worker`)

```
queued ─► CLONING ─► SCANNING ─► PARSING ─► CHUNKING ─► EMBEDDING ─► GRAPHING ─► READY
                                             └─────────────── any failure ─► FAILED (+last_error)
```

| Step      | Work                                                              | Details / guards                                                                                                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLONING   | `git clone --depth 1 --branch {default}` to storage               | SSRF guard: validate the GitHub URL is a real `github.com` repo we already vetted via API. Timeout (e.g. 10 min), size cap (e.g. 1 GB unpacked, `MAX_REPO_SIZE_MB`), disk guard                                                                                                             |
| SCANNING  | walk tree, apply ignore rules                                     | Skip: `.git`, `node_modules`, `dist`, `build`, `.next`, `coverage`, `vendor`, generated dirs, binary extensions, >`MAX_FILE_SIZE` (default 512 KB), symlink loops. Respect `.gitignore`-like default set (curated, not full gitignore semantics in MVP). Hard cap `MAX_FILES` (default 20k) |
| PARSING   | detect language by extension; V2: extract symbols via tree-sitter | Language map: ts/tsx/js/jsx/java/py (MVP) → more via registry (`packages/ingest/languages.ts`)                                                                                                                                                                                              |
| CHUNKING  | split files into semantic chunks                                  | V1: line-based, ~60 lines, 10-line overlap, anchored at blank lines/braces when possible. V2: chunk around symbols (function/class/method) with symbol metadata (`symbol_name`, `symbol_type`, line range)                                                                                  |
| EMBEDDING | batch embeddings (≤128 texts/batch), upsert                       | Retry w/ backoff; on provider failure mark FAILED with actionable error; `ai_runs` rows per batch for cost                                                                                                                                                                                  |
| GRAPHING  | build `dependencies` edges (V2)                                   | regex import analysis first; tree-sitter later; store in `dependencies`                                                                                                                                                                                                                     |
| FINAL     | update `repositories.stats`, `status=READY`, `last_indexed_at`    | Incremental: files unchanged since last index (sha256) keep their chunks — only new/changed files re-embed                                                                                                                                                                                  |

**Progress & observability**

- Each step writes `ingest:{repoId}` progress hash in Redis: `{ step, done, total, message }`.
- `GET /v1/repositories/:id/ingestion` streams via SSE (§2 of `api.md`); web renders the checklist
  from the spec ("Repository connected / ✓ Files discovered / ✓ Code parsed / ⏳ Generating
  embeddings / ○ Building dependency graph / ○ Finalizing index").
- BullMQ job includes `attempts: 3`, backoff, and a job-lock per repository (no concurrent ingest
  of the same repo — `409 conflict` on reindex while running).
- Failures record `last_error` (sanitized — no secrets, no stack traces) and the UI offers Retry.

## 4. Re-indexing & freshness (V2)

- Manual `POST /v1/repositories/:id/reindex` (MVP).
- Webhook (V2): GitHub push/webhook events → validate `X-Hub-Signature-256` with
  `GITHUB_WEBHOOK_SECRET` → enqueue incremental reindex. This is also the trigger for PR/issue
  analysis.
- Incremental strategy (V2): compare `sha256` per file; re-embed only diffs; delete chunks for
  removed files.

## 5. Storage of clones

- Local dev: `data/repos/{repoId}` volume.
- Prod: S3-compatible object store; worker streams clone → tarball → object store, and keeps a
  working copy only during the job. Repo content is regenerable from GitHub, so it is disposable —
  but deletions must be explicit and covered by the privacy policy (§30).
