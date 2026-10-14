/**
 * In-memory sliding-window rate limiter.
 *
 * Not distributed — suitable for single-process dev/staging. For production
 * multi-instance deployments, swap the Map for Redis (documented as future work).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks from abandoned keys.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 300_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Window size in milliseconds. Default: 60 000 (1 minute). */
  windowMs?: number;
  /** Maximum requests per window. Default: 60. */
  max?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check (and record) a request against the rate limit.
 * `key` should be scoped to the client, e.g. IP + route, or userId + route.
 */
export function rateLimit(key: string, config?: RateLimitConfig): RateLimitResult {
  cleanup();

  const windowMs = config?.windowMs ?? 60_000;
  const max = config?.max ?? 60;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const allowed = entry.timestamps.length < max;
  if (allowed) {
    entry.timestamps.push(now);
  }

  const oldest = entry.timestamps[0] ?? now;
  const resetMs = windowMs - (now - oldest);

  return {
    allowed,
    remaining: Math.max(0, max - entry.timestamps.length),
    resetMs,
  };
}

/**
 * Convenience: returns a 429 NextResponse if rate-limited, else null.
 */
export function rateLimitResponse(
  key: string,
  config?: RateLimitConfig,
): { limited: true; response: Response } | { limited: false; response: null } {
  const result = rateLimit(key, config);
  if (result.allowed) return { limited: false, response: null };

  return {
    limited: true,
    response: new Response(
      JSON.stringify({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(result.resetMs / 1000)),
          "X-RateLimit-Limit": String(config?.max ?? 60),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    ),
  };
}
