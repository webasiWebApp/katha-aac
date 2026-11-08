import { create, type StoreApi, type UseBoundStore } from 'zustand';

import type { Role } from '@/core/types/common';
import type { PinService, VerifyResult } from './pin';

export const INACTIVITY_MS = 5 * 60_000;

export interface AuthState {
  role: Role | null;
  signedInAt: number | null;
  signIn(role: Role, pin: string): Promise<VerifyResult>;
  /** Sign in without a PIN check (used after the gate has already verified). */
  setRole(role: Role): void;
  signOut(): void;
  /** Call from a root onTouchStart handler. */
  touch(): void;
}

export function createAuthStore(
  pins: PinService,
  now: () => number = Date.now,
): UseBoundStore<StoreApi<AuthState>> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return create<AuthState>((set, get) => {
    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => get().signOut(), INACTIVITY_MS);
    };
    return {
      role: null,
      signedInAt: null,
      async signIn(role, pin) {
        const result = await pins.verifyPin(role, pin);
        if (result === 'ok') {
          set({ role, signedInAt: now() });
          arm();
        }
        return result;
      },
      setRole(role) {
        set({ role, signedInAt: now() });
        arm();
      },
      signOut() {
        if (timer) clearTimeout(timer);
        timer = null;
        set({ role: null, signedInAt: null });
      },
      touch() {
        if (get().role) arm();
      },
    };
  });
}
