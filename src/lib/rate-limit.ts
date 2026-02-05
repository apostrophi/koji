/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Trade-offs:
 * - Resets on deploy/restart (acceptable for this app)
 * - Not shared across serverless instances
 * - Zero external dependencies
 */

interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the client should retry (0 if allowed) */
  retryAfterMs: number;
}

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
  /** Maximum requests per window (default: 20) */
  maxRequests?: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

/** IP → sorted array of request timestamps */
const hits = new Map<string, number[]>();

/** Counter for periodic cleanup */
let callCount = 0;
const CLEANUP_INTERVAL = 100;

/**
 * Evict IPs whose most recent request is older than the window.
 * Runs every CLEANUP_INTERVAL calls to bound memory growth.
 */
function evictStaleEntries(windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  for (const [ip, timestamps] of hits) {
    if (timestamps[timestamps.length - 1] < cutoff) {
      hits.delete(ip);
    }
  }
}

/**
 * Check whether a request from `ip` is allowed under the rate limit.
 */
export function rateLimit(
  ip: string,
  options?: RateLimitOptions
): RateLimitResult {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Periodic cleanup to prevent unbounded memory growth
  callCount++;
  if (callCount % CLEANUP_INTERVAL === 0) {
    evictStaleEntries(windowMs);
  }

  // Get or create the timestamp array for this IP
  let timestamps = hits.get(ip);
  if (!timestamps) {
    timestamps = [];
    hits.set(ip, timestamps);
  }

  // Prune timestamps outside the current window
  while (timestamps.length > 0 && timestamps[0] < windowStart) {
    timestamps.shift();
  }

  // Check if under the limit
  if (timestamps.length < maxRequests) {
    timestamps.push(now);
    return { allowed: true, retryAfterMs: 0 };
  }

  // Over the limit — calculate when the oldest request in the window expires
  const oldestInWindow = timestamps[0];
  const retryAfterMs = oldestInWindow + windowMs - now;

  return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1) };
}
