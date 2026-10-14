import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { TextEffect } from "@/components/core/text-effect";
import { TextShimmer } from "@/components/core/text-shimmer";

/**
 * Hero + oversized typography from the Stitch marketing reference.
 * Both CTAs route to /login — the current entry point into the product
 * (repository connection arrives in Phase 3).
 */
export function StitchHero() {
  return (
    <>
      <div className="flex flex-col gap-4 max-w-lg pt-16 pb-2">
        <TextShimmer
          className="text-xs tracking-[0.2em] font-mono uppercase text-primary/80"
          duration={1}
        >
          AI Intelligence for Software Systems
        </TextShimmer>
        <h1 className="text-4xl md:text-5xl font-semibold leading-[1.1] text-on-surface tracking-tight">
          Understand your entire software system with AI.
        </h1>
        <TextEffect
          as="p"
          per="char"
          delay={0.4}
          className="text-base text-on-surface-variant leading-relaxed font-light"
          variants={{
            container: {
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.03 },
              },
            },
            item: {
              hidden: { opacity: 0, rotateX: 90, y: 10 },
              visible: {
                opacity: 1,
                rotateX: 0,
                y: 0,
                transition: { duration: 0.2 },
              },
            },
          }}
        >
          Connect your GitHub repository and turn your codebase, architecture, dependencies, and Git
          history into an intelligent, searchable system.
        </TextEffect>
        <div className="flex items-center gap-8 mt-2">
          <Link
            href="/login"
            className="text-on-surface text-sm font-medium border-b border-on-surface/30 pb-1 hover:border-on-surface transition-colors flex items-center gap-2"
          >
            Connect GitHub
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="text-on-surface-variant text-sm font-medium hover:text-on-surface transition-colors"
          >
            Explore Demo
          </Link>
        </div>
      </div>

      <div className="w-full flex flex-col items-center justify-end relative mt-12 mb-4">
        <h2 className="text-[20vw] font-bold tracking-[-0.04em] text-on-background/90 leading-[0.75] w-full text-center select-none z-10 mix-blend-plus-lighter text-glow">
          CodeAtlas
        </h2>
      </div>
    </>
  );
}
