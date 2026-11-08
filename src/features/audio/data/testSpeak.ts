/* eslint-disable @typescript-eslint/no-require-imports */

/** Test sentence spoken during the device check (OB-5, ST-2). NOT RUN (needs device). */
export const TEST_SENTENCE = 'මට වතුර ඕනේ';

export async function devicePlatformSpeak(voice: string | null): Promise<void> {
  if (!voice) return;
  const Speech = require('expo-speech') as typeof import('expo-speech');
  await new Promise<void>((resolve, reject) => {
    Speech.speak(TEST_SENTENCE, {
      language: 'si-LK',
      voice,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: (e) => reject(e instanceof Error ? e : new Error('speech_failed')),
    });
  });
}
