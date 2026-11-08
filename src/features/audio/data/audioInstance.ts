import type { Db } from '@/core/types/manifest';
import { recordAudioAttempt } from '@/features/event-log/index';
import { createAudioService, type AudioService } from '../domain/audioService';
import { devicePlatform } from './devicePlatform';

const instances = new WeakMap<Db, AudioService>();

/** App-wide audio service bound to the open database (one per database handle). */
export function getAudioService(db: Db): AudioService {
  const existing = instances.get(db);
  if (existing) return existing;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clips = require('../../../../assets/audio/index') as {
    wordClips: Record<string, unknown>;
    messageClips: Record<string, unknown>;
    phraseClips: Record<string, unknown>;
  };
  const svc = createAudioService({
    platform: devicePlatform,
    clips: { words: clips.wordClips, messages: clips.messageClips, phrases: clips.phraseClips },
    record: (a) =>
      recordAudioAttempt(db, {
        sessionId: a.sessionId,
        messageId: a.messageId,
        symbolId: a.symbolId,
        kind: a.kind,
        outcome: a.outcome,
        errorCode: a.errorCode,
      }),
  });
  instances.set(db, svc);
  return svc;
}
