# CodeAtlas — Initial Package / Dependency List

Locked at design time (Node 22 LTS, pnpm 10). Every dependency earns its place (§52). Pinned
majors are conservative-and-current; exact versions resolved at Phase 1 install and committed in
the lockfile.

## Root / tooling

| Package                              | Why                                                            |
| ------------------------------------ | -------------------------------------------------------------- |
| `typescript` ^5                      | strict typing everywhere                                       |
| `tsx` ^4                             | run TS scripts (worker entry, seeds) without build step in dev |
| `vitest` ^3                          | unit + integration tests                                       |
| `eslint` ^9 + `typescript-eslint` ^8 | flat config, shared across workspaces                          |
| `prettier` ^3                        | formatting (CI checks it)                                      |
| `dotenv-cli`                         | load env per process in dev scripts                            |
| `concurrently` ^9                    | run web+api+worker together in dev                             |

## `apps/web` (Next.js)

| Package                                                                                                 | Why                                                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `next` ^15 (App Router) + `react` ^19 + `react-dom` ^19                                                 | core UI framework                                                               |
| `tailwindcss` ^4 + `@tailwindcss/postcss`                                                               | styling                                                                         |
| `shadcn/ui` (radix-ui primitives, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`) | accessible component primitives (installed per-component, not as a runtime dep) |
| `react-markdown` + `remark-gfm` + `rehype-highlight`                                                    | chat markdown + syntax highlighting                                             |
| `zod` ^3                                                                                                | client-side form validation mirroring `packages/shared`                         |
| `@sentry/nextjs` (V2)                                                                                   | error tracking (deferred)                                                       |

## `apps/api` (Fastify)

| Package                                                   | Why                                             |
| --------------------------------------------------------- | ----------------------------------------------- |
| `fastify` ^5                                              | HTTP framework, schema validation, plugin model |
| `@fastify/jwt`                                            | access-token signing/verify                     |
| `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit` | security middleware                             |
| `@fastify/sensible`                                       | standard HTTP errors                            |
| `zod` + `fastify-type-provider-zod`                       | typed request/response validation               |
| `argon2`                                                  | password hashing (argon2id)                     |
| `nanoid`                                                  | opaque refresh tokens                           |

## `apps/worker` (BullMQ)

| Package                    | Why                           |
| -------------------------- | ----------------------------- |
| `bullmq` ^5 + `ioredis` ^5 | job queue, retries, job locks |

## `packages/db` (Prisma)

| Package                                        | Why                            |
| ---------------------------------------------- | ------------------------------ |
| `@prisma/client` ^6 + `prisma` ^6 (dev)        | ORM, migrations, types         |
| `pg` (dev, for migration SQL / vector helpers) | raw vector operations in tests |

## `packages/ai`

| Package             | Why                                         |
| ------------------- | ------------------------------------------- |
| `@anthropic-ai/sdk` | Claude API (messages, structured output)    |
| `zod`               | structured-output validation, config schema |

(Embedding + OpenAI-compatible chat calls go through **plain `fetch`** against the provider's
OpenAI-compatible `/v1` endpoints — no extra SDK needed, works with Ollama/Voyage/OpenAI alike.)

## `packages/github`

| Package      | Why                                                                         |
| ------------ | --------------------------------------------------------------------------- |
| `octokit`    | typed GitHub REST client (auth, repo metadata, V2 PR/issue/commit fetching) |
| `simple-git` | clone + incremental diff helpers in the worker                              |

## `packages/ingest`

| Package      | Why                                                 |
| ------------ | --------------------------------------------------- |
| `simple-git` | shallow clone with timeouts                         |
| `ignore`     | curated `.gitignore`-style rules for scan filtering |

## Explicitly NOT added (and why)

| Tech                                   | Why not                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| Graph database (Neo4j)                 | dependencies fit relational tables at this scale (§13)                          |
| Separate vector DB (Pinecone/Weaviate) | pgvector in Postgres covers MVP retrieval; fewer moving parts                   |
| Redux/Zustand                          | React Server Components + fetch state are enough; add only if measured need     |
| n8n / workflow engine                  | optional automation later; not needed to ship the core product                  |
| Terraform                              | platform-native deploys (Vercel/Render) suffice initially; add when infra grows |
| tRPC                                   | REST API is a product surface; keep it framework-neutral                        |
