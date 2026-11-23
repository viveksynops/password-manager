import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, resetRateLimit, clearAllRateLimits } from "@/lib/rate-limit";

describe("Rate Limiting Service (TASK-114)", () => {
  beforeEach(() => {
    clearAllRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests under the limit", () => {
    const key = "test:user:1";
    const res1 = checkRateLimit(key, 5, 60);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(4);

    const res2 = checkRateLimit(key, 5, 60);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("should block requests when limit is reached", () => {
    const key = "test:user:blocked";
    const limit = 3;

    // Consume all 3 points
    expect(checkRateLimit(key, limit, 60).allowed).toBe(true);
    expect(checkRateLimit(key, limit, 60).allowed).toBe(true);
    expect(checkRateLimit(key, limit, 60).allowed).toBe(true);

    // 4th request must be blocked
    const blockedRes = checkRateLimit(key, limit, 60);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.resetInSeconds).toBeGreaterThan(0);
  });

  it("should isolate rate limits between different keys", () => {
    const keyA = "user:A";
    const keyB = "user:B";
    const limit = 2;

    expect(checkRateLimit(keyA, limit, 60).allowed).toBe(true);
    expect(checkRateLimit(keyA, limit, 60).allowed).toBe(true);
    expect(checkRateLimit(keyA, limit, 60).allowed).toBe(false);

    // Key B should still have full quota
    const resB = checkRateLimit(keyB, limit, 60);
    expect(resB.allowed).toBe(true);
    expect(resB.remaining).toBe(1);
  });

  it("should allow requests again after sliding window passes", () => {
    const key = "test:window:reset";
    const limit = 2;
    const windowSeconds = 10;

    expect(checkRateLimit(key, limit, windowSeconds).allowed).toBe(true);
    expect(checkRateLimit(key, limit, windowSeconds).allowed).toBe(true);
    expect(checkRateLimit(key, limit, windowSeconds).allowed).toBe(false);

    // Advance time past the 10-second window
    vi.advanceTimersByTime(11000);

    // Should now be allowed again
    const postWindowRes = checkRateLimit(key, limit, windowSeconds);
    expect(postWindowRes.allowed).toBe(true);
    expect(postWindowRes.remaining).toBe(1);
  });

  it("should allow resetting a key directly", () => {
    const key = "test:manual:reset";
    const limit = 1;

    expect(checkRateLimit(key, limit, 60).allowed).toBe(true);
    expect(checkRateLimit(key, limit, 60).allowed).toBe(false);

    // Reset key (e.g. on successful login)
    resetRateLimit(key);

    // Should be allowed immediately
    expect(checkRateLimit(key, limit, 60).allowed).toBe(true);
  });
});
