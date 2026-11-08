/**
 * WEB PREVIEW ONLY. Browsers have no secure key storage and the web database is not encrypted,
 * so no key is generated. The Android build uses key.ts (SecureStore, D-16).
 */
export async function getOrCreateDbKey(): Promise<string> {
  return 'web-preview-unencrypted';
}
