# CodeAtlas — Design Package

CodeAtlas is an AI-powered developer intelligence platform: connect a GitHub repository, and
CodeAtlas indexes and understands it (code, docs, dependencies, Git history, issues, PRs) so
developers can ask natural-language questions and get **evidence-backed** answers.

This directory is the complete pre-implementation design. **No application code exists yet** —
building starts on the explicit command `START PHASE N` (see `implementation.md`).

| Document                                           | Contents                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| [`architecture.md`](./architecture.md)             | Final system architecture, services, data flow, folder structure |
| [`mvp.md`](./mvp.md)                               | Scoped MVP feature list + acceptance checklist                   |
| [`database.md`](./database.md)                     | ER design: tables, columns, indexes, pgvector                    |
| [`api.md`](./api.md)                               | REST API surface, auth model, error contract                     |
| [`ai-rag.md`](./ai-rag.md)                         | RAG pipeline, prompts, hallucination control, agent tools, MCP   |
| [`github-integration.md`](./github-integration.md) | GitHub OAuth flow + repository ingestion pipeline                |
| [`security.md`](./security.md)                     | Security & threat model                                          |
| [`testing.md`](./testing.md)                       | Unit / integration / AI-evaluation strategy                      |
| [`deployment.md`](./deployment.md)                 | Docker, CI/CD, production topology                               |
| [`environment.md`](./environment.md)               | All environment variables                                        |
| [`dependencies.md`](./dependencies.md)             | Initial package/dependency list                                  |
| [`implementation.md`](./implementation.md)         | 15-phase build plan (the "how we build it" doc)                  |

## Non-negotiable product principles (from the spec)

1. **Evidence > Assumption.** Every AI answer must cite repository evidence (file, lines,
   function, commit, PR). If evidence is insufficient: _"The repository does not contain enough
   evidence to determine this."_ Never fabricate files, APIs, dependencies, commits, or errors.
2. **Not a ChatGPT clone.** Differentiators: codebase memory, dependency intelligence, Git
   intelligence, change-impact analysis, architecture evolution, bug detective.
3. **Every technology must earn its place.** Postgres → data + pgvector. Redis → jobs/cache/rate
   limiting. Claude → reasoning. RAG → retrieval. Graph → dependencies. MCP → external tool
   integration. No hype-driven additions.
4. **Incremental, verifiable development.** Smallest working version → validation → error
   handling → tests → review, per phase. No silent rewrites of unrelated parts.
5. **AI-generated tool calls are untrusted input.** Validate args, check authorization, require
   human approval for destructive actions.

## Canonical decisions (locked in at design time)

- **Monorepo**: pnpm workspaces (`apps/` + `packages/`), Node 22 LTS, TypeScript strict.
- **Frontend**: Next.js (App Router) + React 19 + Tailwind v4 + shadcn/ui.
- **API**: Fastify 5 (separate service, not Next.js route handlers — the API is a product surface).
- **Worker**: BullMQ on Redis for async ingestion (nothing synchronous).
- **Database**: PostgreSQL 16 + pgvector 0.8 via Prisma (raw SQL for vector queries).
- **AI**: Claude (Anthropic) for reasoning; provider-agnostic embedding layer (Voyage for prod,
  OpenAI-compatible/Ollama for local); structured outputs validated with Zod.
- **GitHub**: OAuth App (web flow) with least-privilege scopes; token encrypted at rest.
- **Deploy**: Vercel (web) + Docker containers (api, worker) on Render/Railway + managed
  Postgres/Redis. Local dev fully reproducible with `docker compose up`.
