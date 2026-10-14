# CodeAtlas — Product Description

## The problem

Large repositories are hard to understand. Understanding a codebase requires manually inspecting
source code, documentation, APIs, database schemas, dependencies, Git history, issues, and pull
requests — and connecting the dots between them. Onboarding onto an existing system can take weeks.
Refactoring decisions carry hidden risk because the blast radius of a change is unknown.

## The solution

CodeAtlas is an **AI intelligence layer for software systems**. It connects to a GitHub
repository, builds a persistent, structured understanding of it (code, architecture, dependencies,
Git history), and lets developers ask natural-language questions — receiving **evidence-backed
answers with citations**, not generated guesses.

Core promise: **"Understand your entire software system with AI."**

## Target users

Software developers, backend and full-stack engineers, engineering teams, technical leads,
engineering managers, and developers onboarding onto existing codebases.

## Features

**Now (Phase 1–2):** polished marketing site, SEO, cookie consent, privacy/contact pages, custom
404, GitHub OAuth sign-in, secure database sessions, protected dashboard shell.

**Coming:**

- Connect repository → async ingestion (parse, chunk, embeddings, pgvector)
- Semantic code search and Claude-powered RAG chat with source citations
- Codebase memory, dependency graph, architecture visualization
- Git intelligence (commits, PRs, issues), change-impact analysis, tech-debt detection
- AI agent with tools, MCP integration, bug detective, health scores

## Differentiators

Not a generic ChatGPT clone or PDF chatbot:

1. **Codebase memory** — structured understanding persists across sessions.
2. **Dependency intelligence** — relationships between files, functions, services, databases.
3. **Git intelligence** — commits, PRs, architecture evolution.
4. **Evidence-based answers** — every claim cites real files, lines, commits.
5. **Change-impact analysis** — "what breaks if I remove UserService?" with measured scope.
6. **AI bug detective** — ranked, evidence-backed root-cause hypotheses.

## User journey

```
Landing → Sign in with GitHub → Connect repository → Ingestion progress →
Dashboard (stats, files, languages) → Semantic search → "Ask CodeAtlas" →
Question → Streaming analysis → Cited markdown answer → Click citation → File view
```

## Architecture overview

Next.js web app (Vercel-ready) · Auth.js v5 (GitHub OAuth, database sessions) · PostgreSQL +
Prisma (pgvector for embeddings, Phase 4) · background ingestion (queue, Phase 4) · Claude for
reasoning + provider-agnostic embeddings · Redis for jobs/cache/rate limits (Phase 4).
Design package: `docs/architecture.md`.

## MVP scope

MVP = the core loop end-to-end: sign in → connect repo → index → ask → cited answers. Phases
1–8 in `docs/implementation.md`. Phases 9–15 add graph, agent, MCP, Git intelligence, impact,
tech debt, and production scale-out.

## Roadmap

| Milestone        | Contents                                                                         |
| ---------------- | -------------------------------------------------------------------------------- |
| Phase 1–2 (done) | Foundation, landing, SEO, auth, dashboard shell                                  |
| Phase 3–4        | GitHub repo connection, ingestion pipeline                                       |
| Phase 5–6        | Semantic search, RAG chat with citations                                         |
| Phase 7–8        | Compliance polish, MVP hardening + launch readiness                              |
| Phase 9–15       | Dependency graph, AI agent, MCP, Git intelligence, impact, tech debt, production |
| V4               | Organizations, private-repo UX, usage limits, billing                            |
