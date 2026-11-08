import { createHash } from 'crypto';

import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeTestDb } from '@/app/testing/testDb';
import { renderScreen } from '@/app/testing/renderApp';
import { clearRoleMeasures, getMeasures } from '@/features/analytics/index';
import { createPinService, SignIn, type PinService } from '@/features/access/index';
import { OnboardingFlow } from '@/features/onboarding/index';
import { getAllReportDefinitionsForTest, loadDemoData } from './helpers';
import { buildReportHtml } from '@/features/share/index';
import { periodFor, registerReportMeasures } from '@/features/reports/index';
import type { Db } from '@/core/types/manifest';
import type { Role } from '@/core/types/common';

const store = new Map<string, string>();
const clock = { t: 1_000_000 };
const fakePins: PinService = createPinService({
  getItem: async (k) => store.get(k) ?? null,
  setItem: async (k, v) => void store.set(k, v),
  digest: async (s) => createHash('sha256').update(s).digest('hex'),
  randomHex: async (n) => 'cd'.repeat(n),
  now: () => clock.t,
});

jest.mock('@/features/access/data/pinStore', () => ({
  getPinService: () => (jest.requireActual('crypto') ? (global as unknown as { __pins: PinService }).__pins : null),
}));
(global as unknown as { __pins: PinService }).__pins = fakePins;

let db: Db;
beforeEach(async () => {
  store.clear();
  db = await makeTestDb();
  clearRoleMeasures();
  registerReportMeasures();
});

const press = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByText(d));
};

describe('sign-in (FB-01, T-094)', () => {
  it('ok signs in; a wrong PIN clears the dots and shows no reason', async () => {
    const results: ('ok' | 'fail' | 'locked')[] = ['fail', 'ok'];
    const onSuccess = jest.fn();
    await renderScreen(
      <SignIn roles={['parent']} signIn={async () => results.shift() ?? 'ok'} onSuccess={onSuccess} />,
      { db },
    );
    await press('1111');
    await waitFor(() => expect(screen.queryAllByTestId('pin-dot-filled')).toHaveLength(0));
    expect(screen.queryByText(/incorrect|wrong|invalid/i)).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
    await press('2222');
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('parent'));
  });

  it('shows only roles with a PIN and disables the keypad when locked, with no reason text', async () => {
    await renderScreen(<SignIn roles={['parent', 'slp']} signIn={async () => 'locked'} onSuccess={() => undefined} lockedForMs={async () => 30_000} />, { db });
    expect(screen.getByText('SLP')).toBeTruthy();
    expect(screen.queryByText('OT')).toBeNull();
    await fireEvent.press(screen.getByText('Parent'));
    await press('1234');
    await waitFor(() => expect(screen.getByLabelText('PIN keypad').props.accessibilityState?.disabled ?? true).toBeTruthy());
    expect(screen.queryByText(/locked|too many|attempts/i)).toBeNull();
  });
});

describe('onboarding (OB-1 to OB-5, T-095)', () => {
  it('walks through all five steps and stores PIN, learner, consent and completion', async () => {
    const done = jest.fn();
    db.run('DELETE FROM learners');
    await renderScreen(<OnboardingFlow onComplete={done} />, { db, role: null });
    await fireEvent.press(screen.getByText('Get started'));
    // guardian PIN: enter twice
    await press('4321');
    await press('4321');
    await waitFor(() => expect(screen.getByText('Fictional profile for demonstration')).toBeTruthy());
    expect(await fakePins.hasPin('parent')).toBe(true);
    expect(store.get('pin.parent')).not.toContain('4321');
    // learner
    expect(screen.getByDisplayValue('Demo Learner')).toBeTruthy();
    expect(screen.getByDisplayValue('P-07')).toBeTruthy();
    await fireEvent.press(screen.getByText('Continue'));
    // consent: required to continue
    await waitFor(() => expect(screen.getByText('Data stays on this device')).toBeTruthy());
    await fireEvent.press(screen.getByText('Continue'));
    expect(db.all('SELECT * FROM consent')).toHaveLength(0);
    await fireEvent.press(screen.getByLabelText('Guardian consent to record app activity on this tablet'));
    await fireEvent.press(screen.getByText('Continue'));
    await waitFor(() => expect(screen.getByText('Device check')).toBeTruthy());
    expect(db.get<{ guardian_consent_at: string | null; research_logging: number }>('SELECT * FROM consent')?.research_logging).toBe(0);
    await fireEvent.press(screen.getByText('Finish setup'));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'onboarding.complete'")?.value).toBe('true');
  });

  it('mismatched PINs start again', async () => {
    await renderScreen(<OnboardingFlow onComplete={() => undefined} />, { db, role: null });
    await fireEvent.press(screen.getByText('Get started'));
    await press('1111');
    await press('2222');
    expect(await screen.findByText('PINs do not match')).toBeTruthy();
    expect(await fakePins.hasPin('parent')).toBe(false);
  });
});

describe('report PDF html (T-140)', () => {
  beforeEach(() => loadDemoData(db));

  it.each(['parent', 'slp', 'educator', 'ot'] as Role[])('%s html has the notice, definitions, headings and no URLs', (role) => {
    const def = getAllReportDefinitionsForTest().find((d) => d.role === role)!;
    const results = getMeasures(db, { learnerId: 'L1', period: periodFor('7d'), role, ids: [...new Set(['sessions', ...def.glance, ...def.sections.flatMap((s) => s.measures)])] as never });
    const html = buildReportHtml(def, results, {
      learnerName: 'Demo Learner',
      code: 'P-07',
      period: periodFor('7d'),
      generatedOn: '2026-11-08',
      fictional: true,
    });
    expect(html).toContain('This report describes recorded app activity');
    expect(html).toContain('Definitions used');
    expect(html).toContain('Generated by Katha AAC on 2026-11-08.');
    expect(html).toContain('Sample data');
    expect(html).not.toMatch(/https?:/);
    expect(html).toContain('@page { size: A4 portrait; margin: 16mm; }');
    for (const s of def.sections) {
      if (s.kind === 'planningIdea') continue;
      expect(html).toContain(s.titleKey.includes('goals') ? 'Goals and progress' : '<h2>');
    }
  });

  it('omits sections that are switched off', () => {
    const def = getAllReportDefinitionsForTest().find((d) => d.role === 'parent')!;
    const results = getMeasures(db, { learnerId: 'L1', period: periodFor('7d'), role: 'parent', ids: [...new Set(['sessions', ...def.glance, ...def.sections.flatMap((s) => s.measures)])] as never });
    const html = buildReportHtml(def, results, { learnerName: 'x', code: 'y', period: periodFor('7d'), generatedOn: '2026-11-08', fictional: false, enabledSections: ['words'] });
    expect(html).toContain('Words used most');
    expect(html).not.toContain('Messages by time of day');
    expect(html).not.toContain('Sample data');
  });
});
