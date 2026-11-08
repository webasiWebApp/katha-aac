/**
 * Active-time tracker (pure). Counts foreground milliseconds. A background gap longer than
 * `timeoutMs` (120 s) ends the session. Time source is injected for tests.
 */
export interface ActiveTimeTracker {
  /** App went to the foreground. Returns 'timeout' if the background gap exceeded the limit. */
  foreground(now: number): 'ok' | 'timeout';
  background(now: number): void;
  /** Total active ms as of `now`. */
  total(now: number): number;
  /** True while the app is in the foreground. */
  isActive(): boolean;
}

export function createActiveTimeTracker(
  startNow: number,
  timeoutMs = 120_000,
  initialMs = 0,
): ActiveTimeTracker {
  let accumulated = initialMs;
  let foregroundSince: number | null = startNow;
  let backgroundSince: number | null = null;
  return {
    foreground(now) {
      if (foregroundSince !== null) return 'ok';
      const gap = backgroundSince === null ? 0 : now - backgroundSince;
      backgroundSince = null;
      if (gap > timeoutMs) return 'timeout';
      foregroundSince = now;
      return 'ok';
    },
    background(now) {
      if (foregroundSince === null) return;
      accumulated += now - foregroundSince;
      foregroundSince = null;
      backgroundSince = now;
    },
    total(now) {
      return accumulated + (foregroundSince === null ? 0 : now - foregroundSince);
    },
    isActive() {
      return foregroundSince !== null;
    },
  };
}
