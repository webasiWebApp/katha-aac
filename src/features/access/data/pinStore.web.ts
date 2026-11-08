import { createPinService, type PinService } from '../domain/pin';

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * WEB PREVIEW ONLY. Browsers have no secure storage, so PIN hashes are kept in localStorage.
 * The PIN itself is still only stored as a salted hash. The Android build uses pinStore.ts
 * (expo-secure-store).
 */
export function createDevicePinService(): PinService {
  const crypto = () => require('expo-crypto') as typeof import('expo-crypto');
  const storage = (): Storage => globalThis.localStorage;
  return createPinService({
    getItem: async (key) => storage().getItem(`katha.${key}`),
    setItem: async (key, value) => storage().setItem(`katha.${key}`, value),
    digest: (input) => crypto().digestStringAsync(crypto().CryptoDigestAlgorithm.SHA256, input),
    async randomHex(bytes) {
      const arr = await crypto().getRandomBytesAsync(bytes);
      return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    },
    now: () => Date.now(),
  });
}

let shared: PinService | null = null;
export function getPinService(): PinService {
  if (!shared) shared = createDevicePinService();
  return shared;
}
