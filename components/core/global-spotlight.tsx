"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Full-viewport cursor spotlight that follows the mouse.
 * Light, GPU-accelerated, pointer-events:none — never blocks interaction.
 */
export function GlobalSpotlight() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);

  const onMove = useCallback((e: MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
    if (!visible) setVisible(true);
  }, [visible]);

  const onLeave = useCallback(() => setVisible(false), []);

  useEffect(() => {
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [onMove, onLeave]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ isolation: "isolate" }}
    >
      {/* Outer soft glow */}
      <div
        className="absolute rounded-full transition-opacity duration-500"
        style={{
          left: pos.x,
          top: pos.y,
          width: 320,
          height: 320,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,181,158,0.07) 0%, rgba(255,181,158,0.02) 40%, transparent 70%)",
          opacity: visible ? 1 : 0,
        }}
      />
      {/* Inner brighter core */}
      <div
        className="absolute rounded-full transition-opacity duration-300"
        style={{
          left: pos.x,
          top: pos.y,
          width: 80,
          height: 80,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(255,181,158,0.12) 0%, rgba(255,181,158,0.04) 50%, transparent 80%)",
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
