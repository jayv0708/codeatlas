"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Don't log redirect errors — they're expected
    if (error?.digest?.startsWith("NEXT_REDIRECT")) return;
    console.error("[dashboard] Error:", error.message);
  }, [error]);

  // If this is a redirect error, re-throw so Next.js can handle it
  if (error?.digest?.startsWith("NEXT_REDIRECT")) {
    throw error;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "#0c0e12" }}
    >
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(224,109,123,0.1)",
            border: "1px solid rgba(224,109,123,0.2)",
          }}
        >
          <span className="text-2xl">⚠️</span>
        </div>
        <h1
          className="text-xl font-semibold mb-3"
          style={{ color: "#f4f2eb" }}
        >
          Something went wrong
        </h1>
        <p className="text-sm mb-8" style={{ color: "#a3a19c" }}>
          The dashboard encountered an error. This may be due to a temporary
          database connection issue. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{
              background: "rgba(170,48,0,0.2)",
              color: "#ffb59e",
              border: "1px solid rgba(170,48,0,0.3)",
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#a3a19c",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
