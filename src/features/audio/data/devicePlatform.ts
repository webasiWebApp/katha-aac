import type { AudioPlatform } from '../domain/audioService';

/* eslint-disable @typescript-eslint/no-require-imports */
// Native modules are required lazily so that importing this feature in Jest or on a device
// without the module never crashes at import time.

/**
 * Real platform adapter: expo-audio for recorded clips, expo-speech for the system voice.
 * NOT RUN (needs device): written against the documented APIs, verified only by type check.
 */
export const devicePlatform: AudioPlatform = {
  async findSinhalaVoice() {
    const Speech = require('expo-speech') as typeof import('expo-speech');
    const voices = await Speech.getAvailableVoicesAsync();
    const si = voices.find((v) => v.language.toLowerCase().startsWith('si'));
    return si ? si.identifier : null;
  },

  playClip(source) {
    const { createAudioPlayer } = require('expo-audio') as typeof import('expo-audio');
    return new Promise<void>((resolve, reject) => {
      const player = createAudioPlayer(source as Parameters<typeof createAudioPlayer>[0]);
      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          sub.remove();
          player.release();
          resolve();
        }
      });
      try {
        player.play();
      } catch (e) {
        sub.remove();
        player.release();
        reject(e instanceof Error ? e : new Error('clip_play_failed'));
      }
    });
  },

  speakText(text, voice) {
    const Speech = require('expo-speech') as typeof import('expo-speech');
    return new Promise<void>((resolve, reject) => {
      Speech.speak(text, {
        language: 'si-LK',
        voice,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: (e) => reject(e instanceof Error ? e : new Error('speech_failed')),
      });
    });
  },
};
