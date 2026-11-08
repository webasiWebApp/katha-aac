import { createHash } from 'crypto';

import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeTestDb, TEST_LEARNER } from '@/app/testing/testDb';
import { renderScreen } from '@/app/testing/renderApp';
import { ChildBoardScreen } from '@/app/screens/ChildBoardScreen';
import { clearRoleMeasures } from '@/features/analytics/index';
import { createPinService, type PinService } from '@/features/access/index';
import { GoalsScreen } from '@/features/goals/index';
import { BoardScreen } from '@/features/board/index';
import { TagSheet, getForMessages } from '@/features/observations/index';
import { AdultHomeScreen, startSession, getSession } from '@/features/sessions/index';
import { AboutScreen, ChildViewSettingsScreen, SettingsListScreen , loadDemoData } from '@/features/settings/index';
import { BuilderScreen, DashboardScreen, HistoryScreen, ReportScreen, registerReportMeasures } from '@/features/reports/index';
import { commitMessage } from '@/features/event-log/index';
import { VocabularyScreen } from '@/features/vocabulary/index';
import { LearnerProfileScreen, PrivacyConsentScreen, RolesPermissionsScreen } from '@/features/access/index';

import type { Db } from '@/core/types/manifest';

const store = new Map<string, string>();
const fakePins: PinService = createPinService({
  getItem: async (k) => store.get(k) ?? null,
  setItem: async (k, v) => void store.set(k, v),
  digest: async (s) => createHash('sha256').update(s).digest('hex'),
  randomHex: async (n) => 'ef'.repeat(n),
  now: () => 1_000_000,
});
(global as unknown as { __pins2: PinService }).__pins2 = fakePins;
jest.mock('@/features/access/data/pinStore', () => ({
  getPinService: () => (global as unknown as { __pins2: PinService }).__pins2,
}));

// Tablet-sized window so the child board (not the phone guard) renders.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 1280, height: 800, scale: 1, fontScale: 1 }),
}));

// The auth store used by ChildBoardScreen is created from the (mocked) pin service.
jest.mock('@/app/auth', () => {
  const { createAuthStore } = jest.requireActual('@/features/access/domain/authStore') as typeof import('@/features/access/domain/authStore');
  const g = () => (global as unknown as { __pins2: Record<string, (...a: unknown[]) => unknown> }).__pins2 as Record<string, (...a: unknown[]) => unknown>;
  const lazyPins = {
    verifyPin: (r: unknown, p: unknown) => g().verifyPin?.(r, p),
    hasPin: (r: unknown) => g().hasPin?.(r),
    setPin: (r: unknown, p: unknown) => g().setPin?.(r, p),
    lockedForMs: () => g().lockedForMs?.(),
  } as never;
  return { useAuth: createAuthStore(lazyPins) };
});

let db: Db;
beforeEach(async () => {
  store.clear();
  db = await makeTestDb();
  clearRoleMeasures();
  registerReportMeasures();
});
afterEach(() => jest.useRealTimers());

describe('audio outcome dot (T-079)', () => {
  it('shows the adult dot when audio is unsupported, and nothing else changes', async () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    await renderScreen(
      <BoardScreen sessionId={sid} learnerId={TEST_LEARNER} hand="right" gridSize="3x4" idleReturnSeconds={30} reducedMotion={false} onGate={() => undefined} size={{ width: 1280, height: 800 }} />,
      { db, role: null },
    );
    expect(screen.queryByLabelText('No sound was played')).toBeNull();
    await fireEvent.press(screen.getByLabelText('මට'));
    expect(await screen.findByLabelText('No sound was played')).toBeTruthy();
    expect(screen.queryByText(/error|failed/i)).toBeNull();
  });
});

describe('ending a session from child mode (T-102)', () => {
  it('two fingers held 3 s open sign-in; a correct PIN ends the session (adult_exit) and opens the review', async () => {
    await fakePins.setPin('parent', '4321');
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    commitMessage(db, { messageId: 'm1', draftId: 'd1', sessionId: sid, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_me'], text: 't', vocabularyVersionId: 'v1' });
    const navigation = { replace: jest.fn() };
    jest.useFakeTimers();
    await renderScreen(<ChildBoardScreen navigation={navigation as never} route={{ params: { sessionId: sid } } as never} />, { db, role: null });
    const area = screen.getByTestId('gate-area', { includeHiddenElements: true });
    await fireEvent(area, 'touchStart', {
      nativeEvent: { touches: [{ identifier: 1, locationX: 30, locationY: 30 }, { identifier: 2, locationX: 60, locationY: 50 }] },
    });
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });
    expect(await screen.findByTestId('gate-signin')).toBeTruthy();
    jest.useRealTimers();
    await waitFor(() => expect(screen.getByText('Parent')).toBeTruthy());
    await fireEvent.press(screen.getByText('Parent'));
    for (const d of '4321') await fireEvent.press(screen.getByText(d));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('Adult', { reviewSessionId: sid }));
    expect(getSession(db, sid)?.end_reason).toBe('adult_exit');
    const gate = db.all<{ payload_json: string }>("SELECT payload_json FROM communication_events WHERE type = 'gate_attempt'");
    expect(gate.map((g) => JSON.parse(g.payload_json))).toEqual([{ result: 'success', role: 'parent' }]);
    expect(gate[0]!.payload_json).not.toContain('4321');
  });

  it('cancelling the gate returns to the board with the session still open', async () => {
    await fakePins.setPin('parent', '4321');
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    const navigation = { replace: jest.fn() };
    jest.useFakeTimers();
    await renderScreen(<ChildBoardScreen navigation={navigation as never} route={{ params: { sessionId: sid } } as never} />, { db, role: null });
    await fireEvent(screen.getByTestId('gate-area', { includeHiddenElements: true }), 'touchStart', {
      nativeEvent: { touches: [{ identifier: 1, locationX: 30, locationY: 30 }, { identifier: 2, locationX: 60, locationY: 50 }] },
    });
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });
    await screen.findByTestId('gate-signin');
    jest.useRealTimers();
    await fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByTestId('gate-signin')).toBeNull();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(getSession(db, sid)?.ended_at).toBeNull();
  });

  it('shows an error state when the session does not exist', async () => {
    const navigation = { replace: jest.fn() };
    await renderScreen(<ChildBoardScreen navigation={navigation as never} route={{ params: { sessionId: 'missing' } } as never} />, { db, role: null });
    expect(screen.getByTestId('screen-child-error')).toBeTruthy();
  });
});

describe('TagSheet (T-112)', () => {
  it('choosing writes a row, tapping again clears it, Clear all removes every group', async () => {
    const sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
    commitMessage(db, { messageId: 'm1', draftId: 'd1', sessionId: sid, learnerId: TEST_LEARNER, kind: 'built', symbolIds: ['sym_me'], text: 'මට', vocabularyVersionId: 'v1' });
    await renderScreen(<TagSheet messageId="m1" sentence="මට" onClose={() => undefined} />, { db });
    await fireEvent.press(screen.getByLabelText('Requesting'));
    await fireEvent.press(screen.getByLabelText('Verbal'));
    await fireEvent.press(screen.getByLabelText('Meant'));
    expect(getForMessages(db, ['m1']).map((o) => o.kind).sort()).toEqual(['function', 'intent', 'prompting']);
    await fireEvent.press(screen.getByLabelText('Requesting'));
    expect(getForMessages(db, ['m1']).map((o) => o.kind).sort()).toEqual(['intent', 'prompting']);
    await fireEvent.press(screen.getByText('Clear all'));
    expect(getForMessages(db, ['m1'])).toHaveLength(0);
  });
});

describe('locked and saved-default report states (T-131, T-134)', () => {
  it('a period with fewer than 5 sessions shows the locked caption', async () => {
    loadDemoData(db);
    await renderScreen(<ReportScreen role="parent" initialPreset="today" />, { db, role: 'parent' });
    expect((await screen.findAllByText(/Shown after 5 sessions \(1 so far\)/)).length).toBeGreaterThan(0);
  });

  it('saved defaults hide switched-off sections', async () => {
    loadDemoData(db);
    db.run("INSERT INTO settings (key, value) VALUES ('report.defaults.parent', '[\"words\"]')");
    await renderScreen(<ReportScreen role="parent" />, { db, role: 'parent' });
    await screen.findByTestId('report-glance');
    expect(screen.getAllByText('Words used most').length).toBeGreaterThan(0);
    expect(screen.queryByText('Messages by time of day')).toBeNull();
  });
});

describe('every data screen has a loading-then-error state (T-163)', () => {
  const broken = (real: Db): Db => ({
    run: real.run.bind(real),
    tx: real.tx.bind(real),
    get: () => {
      throw new Error('forced');
    },
    all: () => {
      throw new Error('forced');
    },
  });

  const noop = () => undefined;
  const cases: [string, () => React.ReactElement][] = [
    ['adult home', () => <AdultHomeScreen learnerId={TEST_LEARNER} onStart={noop} onReview={noop} />],
    ['dashboard', () => <DashboardScreen onOpenReport={noop} onBuild={noop} />],
    ['report', () => <ReportScreen role="parent" />],
    ['history', () => <HistoryScreen />],
    ['goals', () => <GoalsScreen learnerId={TEST_LEARNER} onAdd={noop} onEdit={noop} />],
    ['profile', () => <LearnerProfileScreen />],
    ['roles', () => <RolesPermissionsScreen />],
    ['privacy', () => <PrivacyConsentScreen />],
    ['settings', () => <SettingsListScreen onOpen={noop} />],
    ['child view settings', () => <ChildViewSettingsScreen />],
    ['about', () => <AboutScreen />],
    ['vocabulary', () => <VocabularyScreen />],
  ];

  it.each(cases)('%s', async (_name, make) => {
    const bad = broken(db);
    await renderScreen(make(), { db: bad });
    expect(await screen.findByText('Something went wrong. Your records are safe. Please try again.')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    void BuilderScreen;
    void waitFor;
  });
});
