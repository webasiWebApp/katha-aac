import { makeTestDb } from '@/app/testing/testDb';
import type { Db } from '@/core/types/manifest';
import { appendEvent, commitMessage } from '@/features/event-log/index';
import { startSession } from '@/features/sessions/index';
import { getMeasures, registry, type MeasureId } from '../index';

const L = 'L1';
const all = Object.keys(registry) as MeasureId[];
const WORDS = ['sym_me', 'sym_want', 'sym_eat', 'sym_water', 'sym_milk', 'sym_help', 'sym_more'];

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iso(day: number, sec: number): string {
  return new Date(Date.UTC(2026, 9, 1 + day, 6, 0, 0) + sec * 1000).toISOString();
}

function populate(db: Db, seed: number, extraNoise: boolean): number {
  const r = rng(seed);
  let messages = 0;
  const sessionCount = 1 + Math.floor(r() * 8);
  for (let s = 0; s < sessionCount; s++) {
    const day = Math.floor(r() * 7);
    const setting = (['home', 'school', 'therapy', 'unknown'] as const)[Math.floor(r() * 4)] as 'home';
    const sid = startSession(db, { learnerId: L, setting, role: 'parent', at: iso(day, s * 5), offsetMin: 330 });
    let t = s * 5 + 1;
    const drafts = 1 + Math.floor(r() * 4);
    for (let d = 0; d < drafts; d++) {
      const draftId = `d-${seed}-${s}-${d}`;
      const picked: string[] = [];
      const n = 1 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const w = WORDS[Math.floor(r() * WORDS.length)] as string;
        picked.push(w);
        appendEvent(db, { sessionId: sid, learnerId: L, type: 'symbol_selected', at: iso(day, (t += 1)), offsetMin: 330, symbolId: w, draftId, source: 'grid', pageId: 'home' });
        if (extraNoise && r() < 0.3) {
          appendEvent(db, { sessionId: sid, learnerId: L, type: 'undo', at: iso(day, (t += 1)), offsetMin: 330, symbolId: w, draftId, pageId: 'home', payload: { quickUndo: true } });
          picked.pop();
        }
      }
      if (picked.length > 0 && r() < 0.7) {
        commitMessage(db, { messageId: `m-${seed}-${s}-${d}`, draftId, sessionId: sid, learnerId: L, kind: 'built', symbolIds: picked, text: 't', vocabularyVersionId: 'v1', at: iso(day, (t += 1)), offsetMin: 330 });
        messages += 1;
        if (extraNoise) {
          for (let q = 0; q < 2; q++) appendEvent(db, { sessionId: sid, learnerId: L, type: 'message_replayed', at: iso(day, (t += 1)), offsetMin: 330, messageId: `m-${seed}-${s}-${d}` });
        }
      } else if (extraNoise) {
        appendEvent(db, { sessionId: sid, learnerId: L, type: 'clear', at: iso(day, (t += 1)), offsetMin: 330, draftId, pageId: 'home', payload: { symbolCount: picked.length } });
      }
    }
  }
  return messages;
}

const PERIOD = { start: '2026-10-01', end: '2026-10-12' };

describe('invariants over 200 seeded runs', () => {
  it('undo, clear and replay never change messages_sent; percentages sane', async () => {
    for (let seed = 1; seed <= 200; seed++) {
      const db = await makeTestDb();
      const expected = populate(db, seed, true);
      const r = getMeasures(db, { learnerId: L, period: PERIOD, role: 'parent', ids: all });
      expect([seed, r.messages_sent!.value]).toEqual([seed, expected]);
      for (const id of all) {
        const m = r[id]!;
        if (m.numerator !== undefined && m.denominator !== undefined) {
          expect([seed, id, m.numerator <= m.denominator]).toEqual([seed, id, true]);
        }
        if (registry[id].source !== 'template' && m.value !== null && m.denominator !== undefined && m.denominator > 0) {
          expect([seed, id, m.value >= 0 && m.value <= 100]).toEqual([seed, id, true]);
        }
      }
    }
  }, 120_000);
});

describe('performance (T-128)', () => {
  it('365 days x 3 sessions x 40 events: a 30-day period completes under 1 s', async () => {
    const db = await makeTestDb();
    db.tx((t) => {
      for (let day = 0; day < 365; day++) {
        for (let s = 0; s < 3; s++) {
          const startAt = new Date(Date.UTC(2025, 9, 1 + day, 6 + s * 4, 0, 0)).toISOString();
          const sid = `sess-${day}-${s}`;
          t.run(
            `INSERT INTO app_sessions (id, learner_id, vocabulary_version_id, setting, started_at, offset_min, active_ms, started_by_role)
             VALUES (?, ?, 'v1', 'home', ?, 330, 120000, 'parent')`,
            [sid, L, startAt],
          );
          for (let e = 0; e < 40; e++) {
            t.run(
              `INSERT INTO communication_events (id, session_id, learner_id, type, schema_version, at, offset_min, symbol_id, draft_id, source, page_id, payload_json)
               VALUES (?, ?, ?, 'symbol_selected', 1, ?, 330, ?, ?, 'grid', 'home', '{}')`,
              [`${sid}-e${e}`, sid, L, new Date(Date.parse(startAt) + e * 3000).toISOString(), WORDS[e % WORDS.length], `${sid}-d${Math.floor(e / 4)}`],
            );
          }
        }
      }
    });
    const start = Date.now();
    const r = getMeasures(db, { learnerId: L, period: { start: '2026-01-01', end: '2026-01-31' }, role: 'parent', ids: all });
    const elapsed = Date.now() - start;
    expect(r.sessions!.value).toBe(90);
    expect(elapsed).toBeLessThan(1000);
     
    console.log(`T-128 getMeasures(30 days, all measures) = ${elapsed} ms`);
  }, 120_000);
});
