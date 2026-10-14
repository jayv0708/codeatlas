import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * All content sections from the Stitch marketing reference, kept verbatim
 * (typography, spacing, backgrounds, animations, responsiveness).
 */
function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`w-full py-16 sm:py-24 md:py-32 border-t border-white/5 relative scroll-mt-24 ${className}`}
    >
      {children}
    </section>
  );
}

export function StitchSections() {
  return (
    <>
      {/* 1. INTRODUCTION */}
      <Section id="product">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <h3 className="text-3xl sm:text-5xl md:text-7xl font-semibold leading-tight text-on-surface tracking-tight">
            Your codebase already contains the answers.
          </h3>
          <p className="text-xl md:text-2xl text-on-surface-variant font-light leading-relaxed max-w-2xl">
            We extract meaning from your source code, architecture, dependencies, and Git
            history—turning raw data into a conversational, intelligent project memory.
          </p>
        </div>
      </Section>

      {/* 2. PROBLEM */}
      <Section>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32">
          <div className="flex-1">
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-semibold leading-tight text-on-surface tracking-tight md:sticky md:top-32">
              Large codebases are difficult to understand.
            </h3>
          </div>
          <div className="flex-1 flex flex-col font-mono text-sm uppercase tracking-widest text-on-surface-variant">
            <div className="py-12 border-b border-white/10 flex items-start gap-8">
              <span className="text-primary">01</span>
              <span>Unknown dependencies between services.</span>
            </div>
            <div className="py-12 border-b border-white/10 flex items-start gap-8">
              <span className="text-primary">02</span>
              <span>Lost engineering decisions in undocumented PRs.</span>
            </div>
            <div className="py-12 border-b border-white/10 flex items-start gap-8">
              <span className="text-primary">03</span>
              <span>Days wasted onboarding new engineers.</span>
            </div>
            <div className="py-12 flex items-start gap-8">
              <span className="text-primary">04</span>
              <span>Fear of refactoring core legacy modules.</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. HOW IT WORKS */}
      <Section>
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/5" aria-hidden="true" />
        <div className="max-w-6xl mx-auto relative z-10 flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:flex-nowrap md:justify-between text-center font-mono text-xs uppercase tracking-widest">
          <div className="bg-surface border border-white/10 px-4 sm:px-6 py-3 sm:py-4 rounded-full text-on-surface-variant z-10">
            GitHub
          </div>
          <div className="hidden sm:block h-px w-16 bg-white/10" aria-hidden="true" />
          <div className="bg-surface border border-white/10 px-4 sm:px-6 py-3 sm:py-4 rounded-full text-on-surface-variant z-10">
            Code
          </div>
          <div className="hidden sm:block h-px w-16 bg-white/10" aria-hidden="true" />
          <div className="bg-surface border border-primary/30 px-4 sm:px-6 py-3 sm:py-4 rounded-full text-primary z-10 text-glow">
            Project Memory
          </div>
          <div className="hidden sm:block h-px w-16 bg-white/10" aria-hidden="true" />
          <div className="bg-surface border border-white/10 px-4 sm:px-6 py-3 sm:py-4 rounded-full text-on-surface-variant z-10">
            AI Analysis
          </div>
          <div className="hidden sm:block h-px w-16 bg-white/10" aria-hidden="true" />
          <div className="bg-surface border border-white/10 px-4 sm:px-6 py-3 sm:py-4 rounded-full text-on-surface-variant z-10">
            Insights
          </div>
        </div>
      </Section>

      {/* 4. CORE FEATURES */}
      <Section id="features">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-24">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-primary text-xl">01</span>
            <h4 className="text-2xl font-semibold text-on-surface">Codebase Intelligence</h4>
            <p className="text-on-surface-variant font-light leading-relaxed">
              Ask anything about your code. The AI understands context across thousands of files.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-primary text-xl">02</span>
            <h4 className="text-2xl font-semibold text-on-surface">Architecture Graph</h4>
            <p className="text-on-surface-variant font-light leading-relaxed">
              Automatically generate maps of your system architecture and module dependencies.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-primary text-xl">03</span>
            <h4 className="text-2xl font-semibold text-on-surface">Dependency Intelligence</h4>
            <p className="text-on-surface-variant font-light leading-relaxed">
              Trace data flows from API endpoints down to database queries.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-primary text-xl">04</span>
            <h4 className="text-2xl font-semibold text-on-surface">Git Intelligence</h4>
            <p className="text-on-surface-variant font-light leading-relaxed">
              Query the history of why decisions were made by analyzing commits and PRs.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-primary text-xl">05</span>
            <h4 className="text-2xl font-semibold text-on-surface">AI Bug Detective</h4>
            <p className="text-on-surface-variant font-light leading-relaxed">
              Paste an error log, and let the AI trace the root cause through your stack.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="font-mono text-primary text-xl">06</span>
            <h4 className="text-2xl font-semibold text-on-surface">Change Impact</h4>
            <p className="text-on-surface-variant font-light leading-relaxed">
              Know exactly what might break before you make a crucial refactor.
            </p>
          </div>
        </div>
      </Section>

      {/* 5. ARCHITECTURE */}
      <Section id="architecture">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-16">
          <h3 className="text-xs tracking-[0.2em] font-mono uppercase text-on-surface-variant">
            System Architecture
          </h3>
          <div className="w-full border border-white/10 bg-surface/30 rounded-lg relative overflow-hidden p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 sm:gap-0 text-xs font-mono uppercase tracking-widest text-on-surface-variant">
              <div className="border border-white/10 p-3 sm:p-4">Developer</div>
              <div className="flex-grow border-t sm:border-t sm:border-l-0 border-dashed border-white/20 sm:mx-4 h-4 sm:h-px w-full sm:w-auto relative">
                <div className="absolute w-2 h-2 bg-primary rounded-full top-[-4px] animate-ping left-1/2 sm:left-1/2 sm:top-[-4px]" />
              </div>
              <div className="border border-primary/40 text-primary p-4 sm:p-6 bg-primary/5">
                AI Orchestrator
              </div>
              <div className="flex-grow border-t sm:border-t sm:border-l-0 border-dashed border-white/20 sm:mx-4 h-4 sm:h-px w-full sm:w-auto" />
              <div className="flex sm:flex-col gap-2 sm:gap-4">
                <div className="border border-white/10 p-3 sm:p-4 text-center">Code</div>
                <div className="border border-white/10 p-3 sm:p-4 text-center">Git</div>
                <div className="border border-white/10 p-3 sm:p-4 text-center">Docs</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 6. AI CODEBASE CHAT */}
      <Section>
        <div className="max-w-4xl mx-auto flex flex-col gap-16">
          <h3 className="text-3xl md:text-4xl font-semibold text-on-surface tracking-tight">
            Conversational Codebase Intelligence
          </h3>
          <div className="bg-surface/50 border border-white/10 rounded-xl p-8 flex flex-col gap-8 font-mono text-sm shadow-2xl">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" aria-hidden="true" />
              <div className="bg-background/80 border border-white/5 rounded-lg p-4 text-on-surface-variant">
                How does authentication work in this project?
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div
                className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary border border-primary/30"
                aria-hidden="true"
              >
                AI
              </div>
              <div className="bg-background/80 border border-white/5 rounded-lg p-4 text-on-surface flex flex-col gap-4 w-full">
                <p>
                  Authentication is handled via JWT tokens through the{" "}
                  <span className="text-primary">AuthService</span>.
                </p>
                <div className="border-l-2 border-white/10 pl-4 py-2 text-on-surface-variant">
                  Found evidence in:
                  <br />
                  - src/services/AuthService.ts
                  <br />- src/middleware/jwt.ts
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 7. DEPENDENCY INTELLIGENCE */}
      <Section>
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-16">
          <h3 className="text-3xl md:text-4xl font-semibold text-on-surface tracking-tight text-center">
            Understand Data Flow
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs sm:text-sm font-mono tracking-widest text-on-surface-variant">
            <span className="px-3 sm:px-4 py-2 border border-white/10 rounded">UserController</span>
            <ArrowRight className="text-white/30 rotate-90 md:rotate-0" aria-hidden="true" />
            <span className="px-3 sm:px-4 py-2 border border-white/10 rounded">UserService</span>
            <ArrowRight className="text-white/30 rotate-90 md:rotate-0" aria-hidden="true" />
            <span className="px-3 sm:px-4 py-2 border border-white/10 rounded">UserRepository</span>
            <ArrowRight className="text-white/30 rotate-90 md:rotate-0" aria-hidden="true" />
            <span className="px-3 sm:px-4 py-2 border border-primary/30 text-primary rounded bg-primary/5">
              PostgreSQL
            </span>
          </div>
        </div>
      </Section>

      {/* 8. GIT INTELLIGENCE */}
      <Section>
        <div className="max-w-3xl mx-auto flex flex-col gap-16">
          <h3 className="text-3xl md:text-4xl font-semibold text-on-surface tracking-tight">
            Git Evolution
          </h3>
          <div className="flex flex-col gap-12 border-l border-white/10 pl-8 ml-4 relative font-mono text-sm">
            <div className="relative">
              <div
                className="absolute w-3 h-3 bg-primary rounded-full left-[-38px] top-1"
                aria-hidden="true"
              />
              <div className="text-primary mb-2">2025 - Present</div>
              <div className="text-on-surface">Kafka introduced for async event processing.</div>
            </div>
            <div className="relative opacity-70">
              <div
                className="absolute w-3 h-3 bg-surface border border-white/20 rounded-full left-[-38px] top-1"
                aria-hidden="true"
              />
              <div className="text-on-surface-variant mb-2">2024</div>
              <div className="text-on-surface">Redis added for caching API responses.</div>
            </div>
            <div className="relative opacity-50">
              <div
                className="absolute w-3 h-3 bg-surface border border-white/20 rounded-full left-[-38px] top-1"
                aria-hidden="true"
              />
              <div className="text-on-surface-variant mb-2">2023</div>
              <div className="text-on-surface">Initial Authentication module introduced.</div>
            </div>
          </div>
        </div>
      </Section>

      {/* 9. AI BUG DETECTIVE */}
      <Section>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-3xl md:text-4xl font-semibold text-on-surface tracking-tight mb-6">
              AI Bug Detective
            </h3>
            <p className="text-on-surface-variant font-light leading-relaxed">
              Paste your logs. We trace the error through the exact commit that caused it.
            </p>
          </div>
          <div className="bg-[#1e1e24] p-4 sm:p-6 rounded-lg border border-red-900/30 font-mono text-xs text-red-400 flex flex-col gap-3 sm:gap-4">
            <div>&gt; ERROR 401: Unauthorized</div>
            <div className="pl-4 border-l border-red-900/50 text-on-surface-variant">
              Tracing origin...
            </div>
            <div className="pl-4 border-l border-red-900/50">Found in Middleware</div>
            <div className="pl-4 border-l border-red-900/50">JWT Validation failed</div>
            <div className="pl-4 border-l border-red-900/50 text-primary">
              &gt; Root cause: Recent commit abc123x changed secret key env variable.
            </div>
          </div>
        </div>
      </Section>

      {/* 10. CHANGE IMPACT */}
      <Section>
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-12">
          <h3 className="text-3xl sm:text-5xl md:text-6xl font-semibold text-on-surface tracking-tight">
            What breaks if you change this?
          </h3>
          <div className="bg-surface/50 border border-white/10 px-4 sm:px-8 py-3 sm:py-4 rounded-full text-on-surface-variant inline-flex items-center gap-3 sm:gap-4 font-mono text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            High Impact Status: 3 Services, 12 APIs, 5 Components affected.
          </div>
        </div>
      </Section>

      {/* 11. PROJECT MEMORY */}
      <Section className="py-48 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl md:text-6xl font-light text-on-surface tracking-tight italic text-glow">
            Software remembers everything. <br />
            <span className="text-on-surface-variant">Developers shouldn&apos;t have to.</span>
          </h3>
        </div>
      </Section>

      {/* 12. SECURITY */}
      <Section>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-8 sm:gap-16 font-mono text-xs sm:text-sm uppercase tracking-widest text-on-surface-variant">
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-px w-12 bg-primary/50 mb-4" aria-hidden="true" />
            <h4 className="text-on-surface">Private Repos</h4>
            <p className="text-xs opacity-70 normal-case tracking-normal">
              Your code never trains public models.
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-px w-12 bg-primary/50 mb-4" aria-hidden="true" />
            <h4 className="text-on-surface">Permission Awareness</h4>
            <p className="text-xs opacity-70 normal-case tracking-normal">
              Access control mapped directly to GitHub roles.
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-px w-12 bg-primary/50 mb-4" aria-hidden="true" />
            <h4 className="text-on-surface">Secure Access</h4>
            <p className="text-xs opacity-70 normal-case tracking-normal">
              Enterprise-grade encryption in transit and at rest.
            </p>
          </div>
        </div>
      </Section>

      {/* 13. FINAL CTA */}
      <Section className="py-48 relative overflow-hidden flex flex-col items-center justify-center">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,181,158,0.1)_0%,transparent_50%)]"
          aria-hidden="true"
        />
        <h2 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-on-surface text-center mb-8 sm:mb-12 relative z-10 text-glow">
          KNOW YOUR
          <br />
          CODEBASE.
        </h2>
        <Link
          href="/login"
          className="relative z-10 text-background bg-primary px-8 py-4 rounded font-medium hover:bg-white transition-colors"
        >
          Connect GitHub
        </Link>
      </Section>
    </>
  );
}
