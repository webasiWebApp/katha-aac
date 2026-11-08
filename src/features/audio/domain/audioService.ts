import type { AudioOutcome } from '@/core/types/common';

/** Platform calls, injected so the order of fallbacks can be unit tested. */
export interface AudioPlatform {
  /** Identifier of an installed Sinhala voice, or null. */
  findSinhalaVoice(): Promise<string | null>;
  /** Plays a bundled clip; resolves when playback has finished. */
  playClip(source: unknown): Promise<void>;
  /** Speaks text with the system voice; resolves when finished, rejects on error. */
  speakText(text: string, voice: string): Promise<void>;
}

export interface ClipMaps {
  words: Record<string, unknown>;
  messages: Record<string, unknown>;
  phrases: Record<string, unknown>;
}

export interface SpeakContext {
  sessionId: string;
}

export interface SpeakResult {
  outcome: AudioOutcome;
  durationMs: number;
}

export type AudioKind = 'word' | 'message_first' | 'message_replay';

export interface AudioAttemptSink {
  (a: {
    sessionId: string;
    messageId: string | null;
    symbolId: string | null;
    kind: AudioKind;
    outcome: AudioOutcome;
    errorCode: string | null;
  }): void;
}

export interface VoiceStatus {
  found: boolean;
  voice: string | null;
}

export const sequenceKey = (symbolIds: readonly string[]): string => symbolIds.join('+');

/** Order per D-08: recorded clip, then Sinhala voice, then the unsupported state. */
export function createAudioService(deps: {
  platform: AudioPlatform;
  clips: ClipMaps;
  record: AudioAttemptSink;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  let status: VoiceStatus | null = null;

  async function init(): Promise<VoiceStatus> {
    if (status) return status;
    let voice: string | null = null;
    try {
      voice = await deps.platform.findSinhalaVoice();
    } catch {
      voice = null;
    }
    status = { found: voice !== null, voice };
    return status;
  }

  async function run(
    clip: unknown | undefined,
    text: string,
    ctx: SpeakContext,
    meta: { messageId: string | null; symbolId: string | null; kind: AudioKind },
  ): Promise<SpeakResult> {
    const voice = await init();
    const started = now();
    let outcome: AudioOutcome;
    let errorCode: string | null = null;
    try {
      if (clip !== undefined) {
        await deps.platform.playClip(clip);
        outcome = 'clip';
      } else if (voice.found && voice.voice) {
        await deps.platform.speakText(text, voice.voice);
        outcome = 'voice';
      } else {
        outcome = 'unsupported';
      }
    } catch (e) {
      outcome = 'failed';
      errorCode = e instanceof Error ? e.name : 'unknown';
    }
    deps.record({ sessionId: ctx.sessionId, ...meta, outcome, errorCode });
    return { outcome, durationMs: now() - started };
  }

  return {
    init,
    voiceStatus: () => status,
    clipCount: () =>
      Object.keys(deps.clips.words).length +
      Object.keys(deps.clips.messages).length +
      Object.keys(deps.clips.phrases).length,

    speakWord(symbolId: string, text: string, ctx: SpeakContext): Promise<SpeakResult> {
      return run(deps.clips.words[symbolId], text, ctx, { messageId: null, symbolId, kind: 'word' });
    },

    speakMessage(
      m: { messageId: string; symbolIds: string[]; text: string },
      ctx: SpeakContext,
      kind: 'message_first' | 'message_replay',
    ): Promise<SpeakResult> {
      return run(deps.clips.messages[sequenceKey(m.symbolIds)], m.text, ctx, {
        messageId: m.messageId,
        symbolId: null,
        kind,
      });
    },

    speakPhrase(
      p: { messageId: string; phraseId: string; text: string },
      ctx: SpeakContext,
      kind: 'message_first' | 'message_replay' = 'message_first',
    ): Promise<SpeakResult> {
      return run(deps.clips.phrases[p.phraseId], p.text, ctx, {
        messageId: p.messageId,
        symbolId: null,
        kind,
      });
    },
  };
}

export type AudioService = ReturnType<typeof createAudioService>;
