"use client";

import { useEffect, useState } from "react";

import { siteConfig } from "@/lib/seo";

/**
 * Footer matching the screenshot:
 * COPYRIGHT© CODEATLAS SYSTEMS | INDIA | [live clock] | LINKEDIN | GITHUB
 */
export function StitchFooter() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    function update() {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="w-full px-4 sm:px-8 pb-8 pt-4 z-20 relative border-t border-white/5 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs tracking-wider text-on-surface-variant font-mono uppercase gap-4 sm:gap-0">
        <span>Copyright© CodeAtlas Systems</span>
        <span>India</span>
        <span>{time || "\u00A0"}</span>
        <div className="flex gap-8">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-on-surface transition-colors"
          >
            LinkedIn
          </a>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-on-surface transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
