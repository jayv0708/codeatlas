"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TextShimmerProps = {
  children: ReactNode;
  className?: string;
  /** Seconds per full left-to-right sweep. */
  duration?: number;
  /** Element to render as. Defaults to `span`. */
  as?: ElementType;
  zIndex?: number;
};

/**
 * TextShimmer — a highlight band sweeps across the text (motion-primitives
 * pattern). The text is rendered with a moving white gradient clipped to the
 * glyphs (`background-clip: text`), so the sweep reads as a wave of light
 * traveling left-to-right on repeat. Renders static text for reduced-motion
 * users.
 */
export function TextShimmer({
  children,
  className,
  duration = 1,
  as = "span",
  zIndex = 10,
}: TextShimmerProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion.create(as);

  if (reduceMotion) {
    return <span className={cn(className)}>{children}</span>;
  }

  return (
    <MotionTag
      initial="initial"
      animate="animate"
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
      }}
      variants={{
        initial: {
          backgroundPosition: "0% 50%",
        },
        animate: {
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        },
      }}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)",
        backgroundSize: "200% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        zIndex,
      }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}
