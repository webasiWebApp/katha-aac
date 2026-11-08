import { createAudioService, type AudioPlatform } from '../domain/audioService';

function setup(opts: { voice: string | null; clipFails?: boolean; speechFails?: boolean; clips?: Record<string, unknown> }) {
  const calls: string[] = [];
  const recorded: { kind: string; outcome: string; messageId: string | null; symbolId: string | null }[] = [];
  const platform: AudioPlatform = {
    findSinhalaVoice: async () => opts.voice,
    playClip: async (src) => {
      calls.push(`clip:${String(src)}`);
      if (opts.clipFails) throw new Error('boom');
    },
    speakText: async (text, voice) => {
      calls.push(`voice:${voice}:${text}`);
      if (opts.speechFails) throw new Error('tts');
    },
  };
  let t = 0;
  const svc = createAudioService({
    platform,
    clips: { words: {}, messages: opts.clips ?? {}, phrases: { phr_help: 'phrase-clip' } },
    record: (a) => recorded.push(a),
    now: () => (t += 100),
  });
  return { svc, calls, recorded };
}

const ctx = { sessionId: 's1' };
const msg = { messageId: 'm1', symbolIds: ['sym_me', 'sym_water', 'sym_want'], text: 'මට වතුර ඕනේ' };

describe('audio service (D-08 order)', () => {
  it('plays a recorded clip when the exact sequence exists', async () => {
    const { svc, calls, recorded } = setup({ voice: 'si-voice', clips: { 'sym_me+sym_water+sym_want': 'clip-1' } });
    const r = await svc.speakMessage(msg, ctx, 'message_first');
    expect(r.outcome).toBe('clip');
    expect(calls).toEqual(['clip:clip-1']);
    expect(recorded[0]).toMatchObject({ kind: 'message_first', outcome: 'clip', messageId: 'm1' });
  });

  it('falls back to the Sinhala voice when no clip exists', async () => {
    const { svc, calls } = setup({ voice: 'si-voice' });
    const r = await svc.speakMessage(msg, ctx, 'message_replay');
    expect(r.outcome).toBe('voice');
    expect(calls).toEqual(['voice:si-voice:මට වතුර ඕනේ']);
  });

  it('is unsupported with no clip and no voice, and records it', async () => {
    const { svc, calls, recorded } = setup({ voice: null });
    const r = await svc.speakWord('sym_me', 'මට', ctx);
    expect(r.outcome).toBe('unsupported');
    expect(calls).toEqual([]);
    expect(recorded[0]).toMatchObject({ kind: 'word', outcome: 'unsupported', symbolId: 'sym_me', messageId: null });
  });

  it('reports failed when the clip throws, and when the voice throws', async () => {
    const a = setup({ voice: 'v', clips: { 'sym_me+sym_water+sym_want': 'c' }, clipFails: true });
    expect((await a.svc.speakMessage(msg, ctx, 'message_first')).outcome).toBe('failed');
    const b = setup({ voice: 'v', speechFails: true });
    expect((await b.svc.speakMessage(msg, ctx, 'message_first')).outcome).toBe('failed');
    expect(b.recorded).toHaveLength(1);
  });

  it('uses phrase clips for stored phrases', async () => {
    const { svc } = setup({ voice: null });
    const r = await svc.speakPhrase({ messageId: 'm2', phraseId: 'phr_help', text: 'x' }, ctx);
    expect(r.outcome).toBe('clip');
  });

  it('detects the voice once and reports the clip count', async () => {
    const { svc } = setup({ voice: 'v' });
    expect(svc.voiceStatus()).toBeNull();
    await svc.init();
    expect(svc.voiceStatus()).toEqual({ found: true, voice: 'v' });
    expect(svc.clipCount()).toBe(1);
  });

  it('measures duration', async () => {
    const { svc } = setup({ voice: 'v' });
    expect((await svc.speakWord('sym_me', 'x', ctx)).durationMs).toBeGreaterThan(0);
  });
});
