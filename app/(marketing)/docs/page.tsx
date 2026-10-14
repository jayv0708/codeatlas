import type { Metadata } from "next";
import { Spotlight } from "@/components/core/spotlight";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "CodeAtlas documentation — getting started, architecture, database, API, security, and the implementation roadmap.",
};

const DOCS: { file: string; title: string; description: string; icon: string }[] = [
  {
    file: "docs/architecture.md",
    title: "Architecture",
    description:
      "System design: the web app, API, and worker processes, how data flows through the system, and why each technology is present.",
    icon: "⬡",
  },
  {
    file: "docs/database.md",
    title: "Database",
    description:
      "Schema design, indexes, pgvector, and the tenancy rules that scope every query to the owning user.",
    icon: "◈",
  },
  {
    file: "docs/api.md",
    title: "API",
    description:
      "REST contract, authentication, the typed error envelope, and streaming responses.",
    icon: "◇",
  },
  {
    file: "docs/ai-rag.md",
    title: "AI & RAG",
    description:
      "The retrieval pipeline, prompt design, hallucination control, and the read-only agent tool layer.",
    icon: "✦",
  },
  {
    file: "docs/github-integration.md",
    title: "GitHub Integration",
    description: "The GitHub OAuth flow and the repository ingestion pipeline (Phase 3+).",
    icon: "⊕",
  },
  {
    file: "docs/security.md",
    title: "Security",
    description:
      "Threat model and the controls implemented against it — auth, encryption, and least privilege.",
    icon: "◐",
  },
  {
    file: "docs/testing.md",
    title: "Testing",
    description:
      "Unit, integration, API, and AI evaluation strategy, including the retrieval-quality harness.",
    icon: "◉",
  },
  {
    file: "docs/deployment.md",
    title: "Deployment",
    description: "Local Docker Compose setup, production topology, and the CI/CD pipeline.",
    icon: "▲",
  },
  {
    file: "docs/implementation.md",
    title: "Implementation Plan",
    description:
      "The 15-phase build roadmap with objectives, files, database changes, tests, and completion criteria.",
    icon: "↻",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0c0d12] text-on-surface">
      {/* Hero */}
      <section className="px-8 pt-20 pb-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary/80">
            Documentation
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-on-surface">
            Documentation
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-on-surface-variant font-light">
            How CodeAtlas works, how to run it locally, and how the product is built. The full
            documentation ships with the repository in{" "}
            <span className="font-mono text-xs bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-on-surface">
              docs/
            </span>{" "}
            and is published here as the product matures.
          </p>
        </div>
      </section>

      {/* Getting Started */}
      <section className="px-8 pb-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-xl bg-white/5 p-[1px]">
            <Spotlight
              className="from-primary/40 via-primary/20 to-primary/10 blur-3xl"
              size={150}
            />
            <div className="relative rounded-xl bg-surface/80 p-8">
              <h2 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="text-primary">→</span> Getting started
              </h2>
              <pre className="mt-5 overflow-x-auto rounded-lg bg-background/80 border border-white/5 p-5 font-mono text-xs leading-relaxed text-on-surface-variant">
                <code>
                  <span className="text-on-surface-variant/60"># Install dependencies</span>{"\n"}
                  <span className="text-primary">pnpm install</span>{"\n\n"}
                  <span className="text-on-surface-variant/60"># Fill in DATABASE_URL, AUTH_SECRET, GITHUB_CLIENT_ID/SECRET</span>{"\n"}
                  <span className="text-primary">cp</span> .env.example .env{"\n\n"}
                  <span className="text-on-surface-variant/60"># Create + apply migrations</span>{"\n"}
                  <span className="text-primary">pnpm db:migrate</span>{"\n\n"}
                  <span className="text-on-surface-variant/60"># http://localhost:3000</span>{"\n"}
                  <span className="text-primary">pnpm dev</span>
                </code>
              </pre>
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
                See{" "}
                <span className="font-mono text-xs bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-on-surface">
                  README.md
                </span>{" "}
                for the full local setup, environment variables, and GitHub OAuth configuration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Doc Cards with Spotlight */}
      <section className="px-8 pb-20">
        <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCS.map((doc) => (
            <div
              key={doc.file}
              className="group relative overflow-hidden rounded-xl bg-white/5 p-[1px] hover:bg-white/10 transition-all duration-300"
            >
              <Spotlight
                className="from-primary/40 via-primary/20 to-primary/10 blur-3xl"
                size={120}
              />
              <div className="relative rounded-xl bg-surface/80 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-primary text-lg">{doc.icon}</span>
                    <h3 className="text-sm font-semibold text-on-surface">{doc.title}</h3>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant/60 shrink-0">
                    {doc.file}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant font-light">
                  {doc.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Read more</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
