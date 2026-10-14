# CodeAtlas — MVP Feature List & Acceptance Criteria

## Scope philosophy

The MVP proves the **core loop end-to-end**: _sign in → connect GitHub → index a repository → ask
questions → get evidence-backed, cited answers_. Everything else (agent, MCP, Git intelligence,
impact analysis, billing) is V2+ — it would dilute Phase 1–8 and slow the feedback loop. Each
phase ends in a working, testable increment (spec §46).

## MVP feature list (numbered per spec §4)

| #   | Feature                           | Phase | Notes                                                                         |
| --- | --------------------------------- | ----- | ----------------------------------------------------------------------------- |
| 1   | Landing page                      | 1     | SEO metadata, OG, hero, feature strip, CTA → register                         |
| 2   | Authentication (email + password) | 2     | argon2id, JWT access + rotating refresh, login/register/logout/me             |
| 3   | GitHub OAuth                      | 3     | web flow, state CSRF, server-side token exchange, encrypted token storage     |
| 4   | Connect repository                | 3     | pick from user's GitHub repos; ownership verified server-side                 |
| 5   | Repository ingestion              | 4     | async BullMQ pipeline: clone → scan → chunk → embed → READY                   |
| 6   | File indexing                     | 4     | files table, language detection, ignore rules, sha256                         |
| 7   | Code chunking                     | 4     | line-based semantic chunks w/ overlap; symbol anchoring when parser available |
| 8   | Embeddings                        | 4     | provider-agnostic, batched, cost-tracked (`ai_runs`)                          |
| 9   | PostgreSQL + pgvector             | 4     | HNSW index, repo-scoped cosine search                                         |
| 10  | Semantic code search              | 5     | `/v1/repositories/:id/search` + UI results w/ file + line snippets            |
| 11  | Claude-powered RAG chat           | 6     | retrieval → context assembly → Claude structured output                       |
| 12  | Evidence/source citations         | 6     | validated `{file, lines, reason}` chips linking to file view                  |
| 13  | Repository dashboard              | 5     | status checklist, stats (files/languages/chunks), recent activity             |
| 14  | Loading states                    | 1,4,6 | skeletons, ingest progress checklist, chat "analyzing…" states                |
| 15  | Error states                      | 2–6   | typed error contract, actionable messages, retry                              |
| 16  | Custom 404 page                   | 1     | "Lost in the codebase?" + Back to Dashboard / Go Home                         |
| 17  | Privacy policy                    | 7     | real content per §30, legal-review flags                                      |
| 18  | Cookie consent                    | 7     | necessary/optional split; optional loads only after consent                   |
| 19  | SEO metadata                      | 1     | title/description/OG/canonical/robots/sitemap for public pages only           |
| 20  | Contact page                      | 7     | `[REAL PROJECT EMAIL]` placeholder; no invented address                       |
| +   | Terms page                        | 7     | minimal terms-of-service draft + legal review flag                            |

**Explicitly out of MVP:** orgs/teams, private-repo-installation UX, webhooks auto-reindex,
hybrid search, dependency graph, Git intelligence, impact analysis, tech debt, agent/tools/MCP,
billing, API keys. All designed in docs, built in V2–V4.

## MVP user journey

```
Landing → Register/Login → "Connect GitHub" (OAuth) → pick repo → ingest progress checklist
→ dashboard (files, languages, status READY) → semantic search → "Ask CodeAtlas"
→ question → streaming status states → cited markdown answer → click citation → file view
→ new conversation → repeat. → Logout / reconnect GitHub / delete repo.
```

## Acceptance checklist (spec §50, operationalized)

- [ ] User can sign up, log in, log out; session survives refresh; refresh rotation works
- [ ] User connects GitHub via OAuth (state validated, token encrypted at rest, never exposed)
- [ ] User can select + connect a repository; duplicate connect returns existing (idempotent)
- [ ] Repository indexes asynchronously; **progress is visible** (checklist via SSE)
- [ ] Files are discovered, language-detected, ignored correctly, sha256-tracked
- [ ] Code is chunked with line ranges; chunks embed; vectors stored in pgvector
- [ ] Semantic search returns ranked, repo-scoped hits with file + lines + snippet
- [ ] User asks repository questions; Claude receives **only relevant retrieved context**
- [ ] Answers contain evidence: citations render as file links; invalid citations dropped
- [ ] Hallucination safeguards active: similar-content floor, structured-output validation,
      "insufficient repository evidence" path exercised in eval dataset
- [ ] Errors handled: typed envelope, no stack traces/secrets, retryable actions
- [ ] Loading states on all async surfaces (skeletons + progress)
- [ ] Dashboard responsive (mobile-first), accessible, professional
- [ ] Custom 404 exists with CodeAtlas identity
- [ ] Privacy policy + cookie consent (necessary/optional split) exist
- [ ] SEO metadata on public pages; robots/sitemap; dashboard pages excluded from index
- [ ] Contact uses real project email; legal-review flags present
- [ ] Tests: unit + integration green in CI; eval harness runnable
- [ ] Docker compose runs the whole stack locally with documented env
- [ ] README complete (setup, env, OAuth config, troubleshooting)
- [ ] CI pipeline: lint → typecheck → tests → build → audit, gated deploy

## V2 / V3 / V4 backlog (spec §4)

- **V2:** code parsing (tree-sitter), symbols, dependency graph, architecture visualization,
  Git history + commit search, PR analysis, issue analysis, change-impact analysis, tech-debt
  detection, hybrid search, webhook reindex.
- **V3:** agent + tool calling, MCP server, bug detective, doc generator, architecture analysis,
  GitHub issue creation (human-approved), health score, project memory.
- **V4:** workspaces/orgs, private-repo installation UX, usage limits, analytics, billing/Stripe.
