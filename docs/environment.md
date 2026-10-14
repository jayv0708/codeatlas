# CodeAtlas — Environment Variables

All secrets live in env only (`.env` local, platform secret managers in prod). `.env.example`
contains names + placeholder values + comments; **never** real values. Zod-validated at boot
(`packages/shared/config.ts`) — the app refuses to start with missing/empty required vars.

## Required

| Variable                                   | Used by         | Description                                                        |
| ------------------------------------------ | --------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                             | api, worker, db | Postgres connection string (pgvector-enabled)                      |
| `REDIS_URL`                                | api, worker     | Redis connection string (BullMQ + cache + rate limit)              |
| `JWT_SECRET`                               | api             | HMAC key for access tokens (≥32 bytes random)                      |
| `ENCRYPTION_KEY`                           | api, worker     | 32-byte base64 key for AES-256-GCM GitHub-token encryption         |
| `API_URL`                                  | api, worker     | canonical public API base (e.g. `https://api.codeatlas.app`)       |
| `CORS_ORIGIN`                              | api             | comma-separated allowed web origins (never `*`)                    |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | api             | GitHub OAuth App credentials                                       |
| `GITHUB_REDIRECT_URI`                      | api             | OAuth callback (must match GitHub App config)                      |
| `ANTHROPIC_API_KEY`                        | api, worker     | Claude access (unless `CHAT_PROVIDER=ollama`)                      |
| `EMBEDDING_PROVIDER`                       | api, worker     | `voyage` \| `openai-compatible`                                    |
| `EMBEDDING_API_KEY`                        | api, worker     | embedding provider key (blank for local Ollama)                    |
| `EMBEDDING_MODEL`                          | api, worker     | e.g. `voyage-code-2`, `nomic-embed-text`                           |
| `EMBEDDING_DIM`                            | api, worker     | must match pgvector column dim (e.g. `1536`)                       |
| `EMBEDDING_BASE_URL`                       | api, worker     | for OpenAI-compatible endpoints (e.g. `http://localhost:11434/v1`) |
| `CHAT_PROVIDER`                            | api             | `anthropic` \| `openai-compatible`                                 |
| `CHAT_BASE_URL`                            | api             | for OpenAI-compatible chat (Ollama)                                |
| `CHAT_MODEL`                               | api             | e.g. `claude-sonnet-4-5`, `llama3.1`                               |
| `STORAGE_DIR`                              | worker          | repo clone working dir (local `data/repos`, S3 mount in prod)      |
| `NEXT_PUBLIC_API_URL`                      | web             | API base for browser fetches (public by design)                    |
| `NEXT_PUBLIC_APP_URL`                      | web             | canonical site URL (SEO/canonical/OG)                              |

## Optional (tuned, never required)

| Variable                 | Default        | Description                        |
| ------------------------ | -------------- | ---------------------------------- |
| `PORT`                   | `4000`         | api listen port                    |
| `COOKIE_DOMAIN`          | —              | prod cookie domain                 |
| `COOKIE_SECURE`          | `true` in prod | force Secure cookies               |
| `ACCESS_TOKEN_TTL`       | `15m`          | JWT TTL                            |
| `REFRESH_TOKEN_TTL`      | `30d`          | refresh TTL                        |
| `GITHUB_WEBHOOK_SECRET`  | —              | V2 webhook HMAC secret             |
| `MAX_REPO_SIZE_MB`       | `1024`         | clone size cap                     |
| `MAX_FILES`              | `20000`        | file count cap per repo            |
| `MAX_FILE_SIZE_KB`       | `512`          | per-file cap                       |
| `CHUNK_LINES`            | `60`           | chunk size                         |
| `CHUNK_OVERLAP`          | `10`           | overlap lines                      |
| `EMBED_BATCH_SIZE`       | `128`          | embedding batch size               |
| `RAG_TOP_K`              | `20`           | retrieval candidates               |
| `RAG_CHUNK_TOKEN_BUDGET` | `24000`        | context budget for chunks          |
| `RAG_MAX_OUTPUT_TOKENS`  | `2000`         | per-response cap                   |
| `AI_DAILY_SPEND_CAP_USD` | `5.00`         | per-user daily cap (V2 default on) |
| `CHAT_CACHE_TTL_S`       | `900`          | identical-question cache           |
| `LOG_LEVEL`              | `info`         | pino level                         |
| `RATE_LIMIT_*`           | sane defaults  | per-route budgets                  |

## Gotchas

- `EMBEDDING_DIM` is a **schema-level constant**: changing it mid-flight breaks vector search
  (see `ai-rag.md` §2 re-embed runbook).
- `DATABASE_URL` and `REDIS_URL` for tests (`..._TEST`) point at isolated instances — tests never
  touch dev data.
- Next.js public vars are baked at build time (`NEXT_PUBLIC_*`); changing them requires a rebuild.
