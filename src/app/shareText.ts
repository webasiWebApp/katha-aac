/* eslint-disable @typescript-eslint/no-require-imports */

/** Writes text to a temporary file, opens the share sheet, then deletes the file (T-154). NOT RUN (needs device). */
export async function shareText(fileName: string, text: string): Promise<void> {
  const FS = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  const Sharing = require('expo-sharing') as typeof import('expo-sharing');
  const uri = `${FS.cacheDirectory ?? ''}${fileName}`;
  await FS.writeAsStringAsync(uri, text);
  try {
    await Sharing.shareAsync(uri, { mimeType: 'text/plain' });
  } finally {
    await FS.deleteAsync(uri, { idempotent: true });
  }
}
