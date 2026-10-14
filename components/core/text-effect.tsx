"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { createElement, useMemo, type JSX } from "react";

import { cn } from "@/lib/utils";

type PresetType = "blur" | "shake" | "scale" | "fade" | "slide";

type TextEffectProps = {
  children: string;
  per?: "word" | "char" | "line";
  as?: keyof JSX.IntrinsicElements;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  className?: string;
  preset?: PresetType;
  delay?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  segmentWrapperClassName?: string;
};

const defaultStaggerTimes: Record<PresetType, number> = {
  blur: 0.04,
  shake: 0.06,
  scale: 0.03,
  fade: 0.02,
  slide: 0.06,
};

const defaultContainerVariants: Record<PresetType, Variants> = {
  blur: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: defaultStaggerTimes.blur } },
  },
  shake: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: defaultStaggerTimes.shake } },
  },
  scale: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: defaultStaggerTimes.scale } },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: defaultStaggerTimes.fade } },
  },
  slide: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: defaultStaggerTimes.slide } },
  },
};

const defaultItemVariants: Record<PresetType, Variants> = {
  blur: {
    hidden: { opacity: 0, filter: "blur(12px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  shake: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slide: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

function splitText(text: string, per: "word" | "char" | "line") {
  if (per === "line") return text.split(/(\r?\n)/);
  if (per === "word") return text.split(/(\s+)/);
  return text.split("");
}

type CharGroup = { kind: "word" | "space"; value: string };

/**
 * Per-character rendering groups characters into atomic nowrap "word" spans.
 * Without this, each character is its own inline-block and the browser breaks
 * lines mid-word (e.g. "archi/tecture"). Line breaks then only happen at word
 * boundaries, while characters still stagger inside each word.
 */
function groupChars(text: string): CharGroup[] {
  const groups: CharGroup[] = [];
  let word = "";
  const flush = () => {
    if (word) {
      groups.push({ kind: "word", value: word });
      word = "";
    }
  };
  for (const char of text) {
    if (/\s/.test(char)) {
      flush();
      groups.push({ kind: "space", value: char });
    } else {
      word += char;
    }
  }
  flush();
  return groups;
}

/**
 * TextEffect — animate text per character, word, or line (motion-primitives
 * pattern). `delay` sets the container's `delayChildren`; custom `variants`
 * (container/item) override the built-in `preset`s. Renders static text when
 * the user prefers reduced motion.
 */
export function TextEffect({
  children,
  per = "word",
  as = "p",
  variants,
  className,
  preset = "fade",
  delay = 0,
  trigger = true,
  onAnimationComplete,
  segmentWrapperClassName,
}: TextEffectProps) {
  const reduceMotion = useReducedMotion();
  const segments = useMemo(() => splitText(children, per), [children, per]);
  const charGroups = useMemo(() => (per === "char" ? groupChars(children) : null), [per, children]);

  const baseContainer = variants?.container ?? defaultContainerVariants[preset];
  const baseContainerVisible = baseContainer.visible as Record<string, unknown> | undefined;
  const baseContainerTransition =
    (baseContainerVisible?.["transition"] as Record<string, unknown> | undefined) ?? {};
  const containerVariants: Variants = {
    hidden: baseContainer.hidden,
    visible: {
      ...baseContainerVisible,
      transition: { ...baseContainerTransition, delayChildren: delay },
    },
  };
  const itemVariants: Variants = variants?.item ?? defaultItemVariants[preset];
  // In char mode the container's stagger drives word-to-word timing; each word
  // repeats the same interval for its characters.
  const charStagger =
    typeof baseContainerTransition.staggerChildren === "number"
      ? baseContainerTransition.staggerChildren
      : defaultStaggerTimes[preset];

  const MotionTag = (motion as unknown as Record<string, React.ElementType>)[as];

  if (reduceMotion) {
    return createElement(as, { className: cn("whitespace-pre-wrap", className) }, children);
  }

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <MotionTag
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={containerVariants}
          className={cn("whitespace-pre-wrap", className)}
          onAnimationComplete={onAnimationComplete}
        >
          {per === "char" && charGroups
            ? charGroups.map((group, index) =>
                group.kind === "space" ? (
                  group.value
                ) : (
                  <motion.span
                    key={`char-group-${index}`}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: charStagger } },
                    }}
                    className={cn("inline-block whitespace-nowrap", segmentWrapperClassName)}
                  >
                    {group.value.split("").map((char, charIndex) => (
                      <motion.span
                        key={`char-${index}-${charIndex}`}
                        custom={charIndex}
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </motion.span>
                ),
              )
            : segments.map((segment, index) => (
                <motion.span
                  key={`${per}-${index}-${segment}`}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  className={cn(per === "line" ? "block" : "inline-block", segmentWrapperClassName)}
                >
                  {segment}
                </motion.span>
              ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}
