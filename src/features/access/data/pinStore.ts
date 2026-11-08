import { createPinService, type PinService } from '../domain/pin';

/* eslint-disable @typescript-eslint/no-require-imports */
// Native modules are required lazily so importing this feature never crashes at import time.

/** Real PIN service: SecureStore for storage, expo-crypto for SHA-256. Never SQLite, never logs. */
export function createDevicePinService(): PinService {
  const store = () => require('expo-secure-store') as typeof import('expo-secure-store');
  const crypto = () => require('expo-crypto') as typeof import('expo-crypto');
  return createPinService({
    getItem: (key) => store().getItemAsync(key),
    setItem: (key, value) => store().setItemAsync(key, value),
    digest: (input) =>
      crypto().digestStringAsync(crypto().CryptoDigestAlgorithm.SHA256, input),
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
