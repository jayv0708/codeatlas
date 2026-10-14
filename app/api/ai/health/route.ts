/**
 * GET /api/ai/health
 *
 * Returns the health status of the configured AI provider.
 * Server-side only — no API keys exposed.
 */

import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { getAIProvider } from "@/lib/ai/providers";

export async function GET() {
  try {
    // Require authentication — don't expose AI provider status publicly
    await requireApiUser();

    const provider = getAIProvider();
    const available = await provider.isAvailable();

    return NextResponse.json({
      provider: provider.name,
      available,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Don't leak internal details
    return NextResponse.json(
      {
        provider: "unknown",
        available: false,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
