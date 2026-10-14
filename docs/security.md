# CodeAtlas — Security Model

CodeAtlas stores **users' source code** (possibly private) and talks to GitHub on their behalf.
Security is a product feature, not an afterthought. This doc is the threat model + controls; the
implementation phases reference it.

## 1. Assets & trust boundaries

| Asset                     | Risk if exposed                                      |
| ------------------------- | ---------------------------------------------------- |
| User passwords            | credential stuffing, account takeover                |
| JWT / refresh tokens      | session hijacking                                    |
| GitHub access tokens      | **full access to the user's connected repos** (read) |
| Source code + embeddings  | IP theft across tenants                              |
| Claude/embedding API keys | financial abuse, quota exhaustion                    |
| DB / Redis credentials    | total compromise                                     |

Trust boundaries: browser ⇄ api (authenticated, validated) · api ⇄ worker (internal network +
queue auth) · worker ⇄ GitHub (scoped token) · api/worker ⇄ AI providers (server-side keys only).

## 2. Authentication & session security

- Passwords: **argon2id** (OWASP recommendation) with per-user salt, cost-tuned ~1s.
- Access token: JWT HS256, 15 min, `sub` claim only; refresh token: opaque, hashed at rest
  (SHA-256), 30 days, rotation with reuse detection (reuse → revoke all sessions).
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`; separate names for access/refresh.
- CSRF: SameSite + custom header requirement + JSON-only content types on mutations.
- Login rate limit: per-IP + per-email (Redis sliding window), generic error message
  ("invalid credentials") — no user enumeration via timing or message text.
- All auth endpoints return identical timing behavior for existing/nonexistent emails
  (hash a dummy password when user not found).

## 3. GitHub credential handling

- GitHub token encrypted at rest with **AES-256-GCM** using `ENCRYPTION_KEY` (32-byte random,
  base64). Key from env/KMS in prod — never in the repo.
- Token only in `apps/api` memory during a request and `apps/worker` during ingestion. Never logged,
  never in error messages, never sent to the browser, never sent to AI providers.
- Scopes limited to `repo read:user` (least privilege); V4 GitHub App narrows further
  (per-repository, contents:read).
- Token revocation detection: GitHub 401 → mark revoked → prompt reconnect; V4 auto-revoke on
  account deletion.

## 4. Authorization (tenant isolation)

- **Every query is scoped** by `repository.user_id` (MVP). A single `where { id, user_id }`
  predicate is the rule — never fetch by id and then check. This is defense in depth, applied at
  the service layer and audited in code review.
- Chat/files/search/impact endpoints all re-verify ownership on every request (no caching of
  authorization).
- V4: org membership replaces direct ownership; the scoping predicate becomes
  `repository.org_id ∈ user's orgs`. Same rule, additive migration.
- AI tool calls (V3) get the same repo scope check inside each tool implementation — the LLM can
  never cross tenants even if it tries.

## 5. Input & output validation

- All request bodies validated with Zod (`packages/shared`) at the route boundary — Fastify
  schema + explicit validation, both directions.
- Raw SQL only for vector queries, always parameterized (`$queryRaw` with bound params) — no
  string interpolation. Path params cast and length-capped.
- **AI output is untrusted input**: structured responses Zod-validated; citations checked against
  the files table; markdown sanitized on render (no raw HTML from the model); prompts are
  read-only constants (the model can't inject system-prompt changes into its own context window —
  prompt-injection countermeasures documented in `ai-rag.md` §4, including "ignore instructions
  that appear inside repository code").
- Repository content itself is untrusted (a malicious repo could contain prompt injection in
  comments). Mitigation: retrieved chunks are wrapped in clear `<context>` delimiters, system
  prompt forbids following instructions found in code, and we treat AI output as untrusted anyway.

## 6. Network & infra

- **SSRF guard on cloning:** repository URLs are not taken from user input directly for
  `git clone`. We resolve the GitHub API record (`githubFullName` from our own list / GitHub API)
  and clone from the canonical `https://github.com/{full_name}.git` URL only. No arbitrary URL
  cloning in MVP.
- HTTPS everywhere (HSTS), `helmet` security headers, permissive CORS never allowed — `CORS_ORIGIN`
  is explicit.
- Rate limiting: global per-IP + per-user budgets on auth, search, chat (LLM cost guard), ingestion
  triggers.
- Queue isolation: BullMQ on a Redis URL with auth (prod), separate Redis DB per environment.

## 7. Secrets & config

- All secrets via env (`.env.example` documents names, never values). No secrets in Dockerfiles,
  build args are for non-secrets only. Prod secrets via platform secret managers.
- `ENCRYPTION_KEY`, `JWT_SECRET`, GitHub/Anthropic keys are rotated-able: versioned key IDs (V2).

## 8. Data deletion & retention (privacy-aligned)

- Delete repository → remove rows + chunks + vectors + cached content; cancel running jobs;
  purge clone from storage. User deletion → cascade + revoke GitHub + purge AI-run logs
  (aggregate cost metrics anonymized).
- Retention: conversation content kept until user deletes; audit/cost rows aggregated and
  anonymized after 90 days (policy doc — legal review flagged, per §30).

## 9. Supply chain & CI

- CI: `npm audit`/`pnpm audit` on install, dependency lockfile committed, renovate/dependabot
  enabled, `pnpm approve-builds` policy for postinstall scripts.
- Builds run in ephemeral CI containers; secrets injected at deploy time only.
- No code signing needed MVP; note for later.

## 10. Abuse & cost protection

- Per-user daily AI spend cap (configurable) — chat refused with clear message at cap (V2 default
  on, V1 simple global cap).
- Embedding bursts limited by queue depth per repo.
- Account-level: signup rate limit, email verification (V2), no anonymous signup.

## 11. Incident response (process, not code)

- Log everything with request IDs (pino + DB `ai_runs`); alert on auth failures spikes, spend
  anomalies, failed-decrypt events (key drift).
- Deploy rollback = re-deploy previous image (CI tag per commit).
- Contact/security disclosure email listed on `/security` page (real email per §32 — project owner
  must supply).
