import { createHash } from 'crypto';

import { makeTestDb, TEST_LEARNER } from '@/app/testing/testDb';
import type { Role } from '@/core/types/common';
import { appendEvent, commitMessage } from '@/features/event-log/index';
import { endSession, startSession } from '@/features/sessions/index';
import { createAuthStore, INACTIVITY_MS } from '../domain/authStore';
import { canView, DEFAULT_PERMISSIONS, loadPermissions, ROLES, savePermission, type Resource } from '../domain/permissions';
import { createPinService, type PinDeps } from '../domain/pin';
import { deleteAllRecords, deleteRecordsOlderThan, getConsent, saveConsent, withdrawFromResearch } from '../data/learnerRepo';

function makeDeps(): PinDeps & { store: Map<string, string>; clock: { t: number } } {
  const store = new Map<string, string>();
  const clock = { t: 1_000_000 };
  return {
    store,
    clock,
    getItem: async (k) => store.get(k) ?? null,
    setItem: async (k, v) => void store.set(k, v),
    digest: async (s) => createHash('sha256').update(s).digest('hex'),
    randomHex: async (n) => 'ab'.repeat(n),
    now: () => clock.t,
  };
}

describe('PIN service', () => {
  it('rejects anything but 4 digits', async () => {
    const pins = createPinService(makeDeps());
    for (const bad of ['123', '12345', 'abcd', '12a4', '']) {
      await expect(pins.setPin('parent', bad)).rejects.toThrow();
    }
  });

  it('stores salted hash JSON, never the PIN, and verifies', async () => {
    const deps = makeDeps();
    const pins = createPinService(deps);
    await pins.setPin('parent', '1234');
    const raw = deps.store.get('pin.parent')!;
    expect(raw).not.toContain('1234');
    const parsed = JSON.parse(raw) as { salt: string; hash: string; iterations: number };
    expect(parsed.iterations).toBe(1000);
    expect(parsed.salt).toHaveLength(32);
    expect(await pins.hasPin('parent')).toBe(true);
    expect(await pins.hasPin('slp')).toBe(false);
    expect(await pins.verifyPin('parent', '1234')).toBe('ok');
    expect(await pins.verifyPin('parent', '9999')).toBe('fail');
  });

  it('locks for 60 s after 5 failures, then unlocks; success resets the counter', async () => {
    const deps = makeDeps();
    const pins = createPinService(deps);
    await pins.setPin('slp', '1111');
    for (let i = 0; i < 4; i++) expect(await pins.verifyPin('slp', '0000')).toBe('fail');
    expect(await pins.verifyPin('slp', '1111')).toBe('ok'); // resets
    for (let i = 0; i < 5; i++) expect(await pins.verifyPin('slp', '0000')).toBe('fail');
    expect(await pins.verifyPin('slp', '1111')).toBe('locked');
    expect(await pins.lockedForMs()).toBeGreaterThan(0);
    deps.clock.t += 60_001;
    expect(await pins.verifyPin('slp', '1111')).toBe('ok');
  });

  it('lockout counts failures across roles', async () => {
    const deps = makeDeps();
    const pins = createPinService(deps);
    await pins.setPin('slp', '1111');
    await pins.setPin('ot', '2222');
    for (const r of ['slp', 'ot', 'slp', 'ot', 'slp'] as Role[]) await pins.verifyPin(r, '0000');
    expect(await pins.verifyPin('ot', '2222')).toBe('locked');
  });
});

describe('auth store', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('signs in, rejects wrong PIN, and times out after 5 minutes without touch', async () => {
    const pins = createPinService(makeDeps());
    await pins.setPin('parent', '1234');
    const store = createAuthStore(pins);
    expect(await store.getState().signIn('parent', '0000')).toBe('fail');
    expect(store.getState().role).toBeNull();
    expect(await store.getState().signIn('parent', '1234')).toBe('ok');
    expect(store.getState().role).toBe('parent');
    jest.advanceTimersByTime(INACTIVITY_MS - 1000);
    store.getState().touch();
    jest.advanceTimersByTime(INACTIVITY_MS - 1000);
    expect(store.getState().role).toBe('parent');
    jest.advanceTimersByTime(1500);
    expect(store.getState().role).toBeNull();
  });

  it('signOut clears the role', async () => {
    const pins = createPinService(makeDeps());
    await pins.setPin('ot', '4321');
    const store = createAuthStore(pins);
    await store.getState().signIn('ot', '4321');
    store.getState().signOut();
    expect(store.getState().role).toBeNull();
  });

  it('lockout is reported on sign-in', async () => {
    const deps = makeDeps();
    const pins = createPinService(deps);
    await pins.setPin('ot', '4321');
    const store = createAuthStore(pins);
    for (let i = 0; i < 5; i++) await store.getState().signIn('ot', '0000');
    expect(await store.getState().signIn('ot', '4321')).toBe('locked');
  });
});

describe('permissions truth table', () => {
  const resources: Resource[] = ['report:parent', 'report:slp', 'report:educator', 'report:ot', 'history', 'export', 'observations:enter', 'admin'];
  const expected: Record<Role, Record<Resource, boolean>> = {
    parent: { 'report:parent': true, 'report:slp': true, 'report:educator': true, 'report:ot': true, history: true, export: true, 'observations:enter': true, admin: true },
    slp: { 'report:parent': false, 'report:slp': true, 'report:educator': false, 'report:ot': false, history: true, export: true, 'observations:enter': true, admin: false },
    educator: { 'report:parent': false, 'report:slp': false, 'report:educator': true, 'report:ot': false, history: false, export: false, 'observations:enter': true, admin: false },
    ot: { 'report:parent': false, 'report:slp': false, 'report:educator': false, 'report:ot': true, history: false, export: false, 'observations:enter': true, admin: false },
  };
  it.each(ROLES)('%s', (role) => {
    for (const r of resources) expect([role, r, canView(role, r, DEFAULT_PERMISSIONS)]).toEqual([role, r, expected[role][r]]);
  });
  it('null role sees nothing', () => {
    expect(canView(null, 'history', DEFAULT_PERMISSIONS)).toBe(false);
  });
  it('only parent can change permissions; db rows load and update', async () => {
    const db = await makeTestDb();
    expect(loadPermissions(db)).toEqual(DEFAULT_PERMISSIONS);
    expect(() => savePermission(db, 'slp', 'ot', { canExport: true })).toThrow();
    savePermission(db, 'parent', 'ot', { canExport: true });
    expect(loadPermissions(db).ot.canExport).toBe(true);
    expect(db.all('SELECT * FROM role_permissions')).toHaveLength(4);
  });
});

describe('consent and deletion', () => {
  it('records consent and withdrawal; non-parent refused', async () => {
    const db = await makeTestDb();
    saveConsent(db, TEST_LEARNER, { guardianConsent: true }, 'parent');
    expect(getConsent(db, TEST_LEARNER)?.guardian_consent_at).toBeTruthy();
    saveConsent(db, TEST_LEARNER, { researchLogging: true }, 'parent');
    expect(getConsent(db, TEST_LEARNER)?.research_logging).toBe(1);
    expect(() => withdrawFromResearch(db, TEST_LEARNER, 'slp')).toThrow();
    withdrawFromResearch(db, TEST_LEARNER, 'parent');
    const c = getConsent(db, TEST_LEARNER)!;
    expect([c.research_logging, !!c.withdrawn_at]).toEqual([0, true]);
  });

  it('delete all leaves zero data rows and keeps learner/permissions/vocabulary', async () => {
    const db = await makeTestDb();
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    appendEvent(db, { sessionId: sid, learnerId: TEST_LEARNER, type: 'undo' });
    commitMessage(db, { messageId: 'm1', draftId: 'd1', sessionId: sid, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_me'], text: 't', vocabularyVersionId: 'v1' });
    endSession(db, sid, 'adult_exit');
    expect(() => deleteAllRecords(db, 'ot')).toThrow();
    deleteAllRecords(db, 'parent');
    for (const t of ['app_sessions', 'communication_events', 'communication_attempts', 'audio_attempts']) {
      expect(db.all(`SELECT * FROM ${t}`)).toHaveLength(0);
    }
    expect(db.all('SELECT * FROM learners')).toHaveLength(1);
    expect(db.all('SELECT * FROM role_permissions')).toHaveLength(4);
    expect(db.all('SELECT * FROM vocabulary_versions')).toHaveLength(1);
  });

  it('retention deletes only old sessions', async () => {
    const db = await makeTestDb();
    const old = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: '2025-01-01T00:00:00.000Z', offsetMin: 0 });
    const recent = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent', at: '2026-10-01T00:00:00.000Z', offsetMin: 0 });
    const n = deleteRecordsOlderThan(db, 'parent', 12, new Date('2026-11-01T00:00:00Z'));
    expect(n).toBe(1);
    expect(db.all<{ id: string }>('SELECT id FROM app_sessions').map((r) => r.id)).toEqual([recent]);
    expect(old).not.toBe(recent);
  });
});
