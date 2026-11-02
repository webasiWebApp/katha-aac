import { randomUUID } from 'crypto';

/** Jest mock for expo-crypto — uses Node.js crypto. */
module.exports = {
  randomUUID,
  getRandomBytesAsync: async (byteCount: number): Promise<Uint8Array> => {
    const bytes = new Uint8Array(byteCount);
    for (let i = 0; i < byteCount; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  },
};
