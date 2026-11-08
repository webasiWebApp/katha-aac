import type { Role } from '@/core/types/common';

export interface PinDeps {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  /** SHA-256 hex digest of a string. */
  digest(input: string): Promise<string>;
  /** n random bytes as hex. */
  randomHex(bytes: number): Promise<string>;
  now(): number;
}

export const PIN_ITERATIONS = 1000;
export const MAX_FAILURES = 5;
export const LOCK_MS = 60_000;

interface StoredPin {
  salt: string;
  hash: string;
  iterations: number;
}
interface LockState {
  failedCount: number;
  lockedUntil: number;
}

export type VerifyResult = 'ok' | 'fail' | 'locked';

async function hashPin(deps: PinDeps, salt: string, pin: string, iterations: number): Promise<string> {
  let h = await deps.digest(salt + pin);
  for (let i = 1; i < iterations; i++) h = await deps.digest(h);
  return h;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function createPinService(deps: PinDeps) {
  async function readLock(): Promise<LockState> {
    const raw = await deps.getItem('pin.lock');
    if (!raw) return { failedCount: 0, lockedUntil: 0 };
    return JSON.parse(raw) as LockState;
  }
  const writeLock = (s: LockState) => deps.setItem('pin.lock', JSON.stringify(s));

  return {
    async setPin(role: Role, pin: string): Promise<void> {
      if (!isValidPin(pin)) throw new Error('PIN must be exactly 4 digits');
      const salt = await deps.randomHex(16);
      const hash = await hashPin(deps, salt, pin, PIN_ITERATIONS);
      const stored: StoredPin = { salt, hash, iterations: PIN_ITERATIONS };
      await deps.setItem(`pin.${role}`, JSON.stringify(stored));
    },

    async hasPin(role: Role): Promise<boolean> {
      return (await deps.getItem(`pin.${role}`)) !== null;
    },

    /** Remaining lock time in ms (0 when not locked). */
    async lockedForMs(): Promise<number> {
      const lock = await readLock();
      return Math.max(0, lock.lockedUntil - deps.now());
    },

    async verifyPin(role: Role, pin: string): Promise<VerifyResult> {
      const lock = await readLock();
      if (lock.lockedUntil > deps.now()) return 'locked';
      const raw = await deps.getItem(`pin.${role}`);
      let ok = false;
      if (raw && isValidPin(pin)) {
        const stored = JSON.parse(raw) as StoredPin;
        ok = (await hashPin(deps, stored.salt, pin, stored.iterations)) === stored.hash;
      }
      if (ok) {
        await writeLock({ failedCount: 0, lockedUntil: 0 });
        return 'ok';
      }
      const failedCount = lock.failedCount + 1;
      if (failedCount >= MAX_FAILURES) {
        await writeLock({ failedCount: 0, lockedUntil: deps.now() + LOCK_MS });
      } else {
        await writeLock({ failedCount, lockedUntil: 0 });
      }
      return 'fail';
    },
  };
}

export type PinService = ReturnType<typeof createPinService>;
