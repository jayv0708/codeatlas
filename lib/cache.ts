/**
 * CodeAtlas In-Memory TTL Cache
 *
 * Simple key-value cache with per-entry TTL. Used for hot-path data
 * like repository validation, AI provider health status, and embedding
 * dedup checks. Not distributed — suitable for single-process dev/staging.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value. Returns undefined if missing or expired.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Set a cache entry with a TTL in seconds.
 */
export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Delete a specific cache entry.
 */
export function cacheDelete(key: string): void {
  store.delete(key);
}

/**
 * Delete all entries matching a prefix (e.g., invalidate all repo cache).
 */
export function cacheDeletePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/**
 * Clear the entire cache.
 */
export function cacheClear(): void {
  store.clear();
}

/**
 * Get or set — retrieve from cache, or compute and store the result.
 */
export async function cacheGetOrSet<T>(
  key: string,
  compute: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) return cached;
  const value = await compute();
  cacheSet(key, value, ttlSeconds);
  return value;
}
