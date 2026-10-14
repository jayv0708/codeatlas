# CodeAtlas — Developer Instructions

Operating rules for anyone (human or AI) working on this codebase. Read before writing code.

## 1. Product purpose

CodeAtlas is an AI intelligence layer for software systems: connect a GitHub repository, and it
indexes and understands the codebase so developers can ask natural-language questions and receive
**evidence-backed answers with citations**. Never fabricate repository facts. Evidence > assumption.

## 2. Architecture (current, Phase 1–2)

Single Next.js 15 app (App Router). Auth via Auth.js v5 (GitHub OAuth, database sessions, Prisma
adapter). PostgreSQL via Prisma. See `docs/architecture.md` for the target architecture —
repository integration and background ingestion will likely introduce a worker process in Phase 4;
do not pre-build it.

## 3. Folder structure

```
app/          routes (route groups: (marketing), (auth), (dashboard)) + api/
components/   ui/ (primitives), site/ (marketing), dashboard/, auth/
lib/          pure logic + helpers (no components)
services/     server-only singletons (auth, db)
hooks/        client hooks
types/        shared types + module augmentations
tests/        Vitest tests (components/ → jsdom, integration/ → node+DB)
prisma/       schema + migrations
docs/         design package
infra/        docker compose
```

## 4. Coding standards

- TypeScript strict. No `any` without a written justification (ESLint warns).
- Server components by default; add `"use client"` only when interactivity requires it.
- Accessible: semantic HTML, `aria-*` labels, keyboard focus rings, skip links, `prefers-reduced-motion`.
- Access server-only things (Prisma, Auth.js) only in server components / route handlers /
  `services/`. Never ship secrets or server data to the client bundle.
- Components: shadcn-style primitives in `components/ui`; feature components elsewhere. Small,
  reusable, one job each.
- Styling: Tailwind utility classes; design tokens in `app/globals.css`; no inline styles except
  dynamic values.

## 5. AI rules (applies from Phase 4+)

- Every LLM response must be validated (structured output + Zod) before it is persisted or shown.
- Citations must be checked against the repository's real files before display.
- Prompts live in versioned constants (reviewable + testable), not scattered strings.
- AI output is untrusted input. Sanitize markdown, validate JSON, never execute tool results
  without authorization checks.
- Label FACT / INFERENCE / UNKNOWN. "Insufficient repository evidence" is a valid answer.

## 6. Security rules

- All secrets via environment variables; never hardcode. `.env` is gitignored; `.env.example`
  documents names only.
- Never log tokens, passwords, or personal data. Error responses never include stack traces.
- Derive the authenticated user from the server session (`requireSession`), never from client input.
- Every database query touching user data is scoped by ownership. No "fetch by id then check".
- GitHub tokens are encrypted at rest (Phase 3+) and never sent to the browser or AI providers.
- LLM-generated tool calls are untrusted: validate arguments, check authorization, require human
  approval for destructive actions.

## 7. Git conventions

- Conventional-ish commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- Work in phases (docs/implementation.md); no silent rewrites of unrelated parts.
- CI must pass before merge: lint → format:check → typecheck → tests → build.

## 8. Testing conventions

- Unit tests for pure logic (`lib/`), component tests for UI behavior, integration tests for DB.
- Component tests in jsdom; DB integration tests run against `DATABASE_URL_TEST` (never dev data).
- If a DB test needs a fixture, seed it in the test and clean up after.
- AI evals (Phase 6+) measure retrieval hit-rate, evidence accuracy, hallucination rate, cost.

## 9. Environment variable rules

- Every new variable: add to `.env.example` **with a comment** and to this doc's env table if
  non-obvious. Never commit real values.
- `NEXT_PUBLIC_*` vars are baked at build time and visible to the browser — never put secrets there.

## 10. Deployment rules

- Deploys only via CI after all checks pass. Roll back by redeploying the previous image.
- Prod secrets live in the platform secret manager, injected as env at deploy time.
- No deploy of a phase that isn't documented + tested.

## 11. Placeholders & legal

- Contact email is `[REAL PROJECT EMAIL]` (see `lib/seo.ts`). No fake business addresses.
- Privacy policy is a draft with legal-review flags — do not remove those flags before legal review.

## 12. Contact placeholders checklist (before launch)

- [ ] Replace `[REAL PROJECT EMAIL]` in `lib/seo.ts` (footer, contact page, privacy page).
- [ ] Remove the "placeholder notice" callouts on `/contact` and `/privacy`.
- [ ] Legal review of privacy policy + terms before public launch.
