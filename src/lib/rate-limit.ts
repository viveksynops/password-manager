/**
 * Rate Limiting Service (TASK-114)
 * Provides sliding-window rate limiting for authentication and sensitive actions.
 * Zero external cost, memory-leak proof with periodic cleanup, and fully unit-testable.
 */

interface RateLimitEntry {
  timestamps: number[];
}

// Global in-memory sliding window store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Interval to periodically clean up expired rate limit entries (every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null;

function ensureCleanupTimer() {
  if (cleanupInterval || typeof setInterval === "undefined") return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove timestamps older than 1 hour
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < 3600 * 1000);
      if (entry.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Unref so timer doesn't prevent Node process from exiting
  if (cleanupInterval && typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and records a rate-limit point for a given key using a sliding window.
 *
 * @param key Unique identifier for the rate limit target (e.g. "login:ip:email" or "reveal:userId")
 * @param limit Maximum number of allowed requests in the time window
 * @param windowSeconds Duration of the rate limit window in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  ensureCleanupTimer();

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const threshold = now - windowMs;

  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Filter out timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((ts) => ts > threshold);

  if (entry.timestamps.length >= limit) {
    // Oldest timestamp in window tells us when the earliest slot frees up
    const oldest = entry.timestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  // Record this attempt
  entry.timestamps.push(now);

  const remaining = Math.max(0, limit - entry.timestamps.length);
  const oldest = entry.timestamps[0];
  const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

  return {
    allowed: true,
    remaining,
    resetInSeconds,
  };
}

/**
 * Resets the rate limit for a key (e.g. after a successful login or in unit tests).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clears all rate limit state (primarily for test teardown).
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
