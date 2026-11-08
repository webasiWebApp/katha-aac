import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeTestDb, TEST_LEARNER } from '@/app/testing/testDb';
import { renderScreen } from '@/app/testing/renderApp';
import { clearRoleMeasures , getMeasures } from '@/features/analytics/index';
import { registerReportMeasures , BuilderScreen, DashboardScreen, HistoryScreen, ReportScreen , periodFor } from '@/features/reports/index';
import { GoalEditScreen, GoalsScreen, createGoal } from '@/features/goals/index';
import { LearnerProfileScreen, PrivacyConsentScreen, RolesPermissionsScreen, deleteAllRecords, getConsent, saveConsent } from '@/features/access/index';
import { ReviewSessionScreen } from '@/features/observations/index';

import { AdultHomeScreen, StartSessionScreen, listUnreviewedSessions } from '@/features/sessions/index';
import {
  AboutScreen,
  ChildViewSettingsScreen,
  DataRetentionScreen,
  DEMO_MESSAGES,
  DEMO_SESSIONS,
  SettingsListScreen,
  VoiceAudioScreen,
  loadDemoData,
} from '@/features/settings/index';
import { ShareScreen } from '@/features/share/index';
import { VocabularyScreen } from '@/features/vocabulary/index';

import type { Db } from '@/core/types/manifest';


let db: Db;
beforeEach(async () => {
  db = await makeTestDb();
  clearRoleMeasures();
  registerReportMeasures();
});

const parent = () => ({ db, role: 'parent' as const });

describe('demonstration data (T-172)', () => {
  it('creates 9 sessions and 83 messages and unlocks the 5-session measures', () => {
    loadDemoData(db);
    const r = getMeasures(db, { learnerId: TEST_LEARNER, period: periodFor('7d'), role: 'parent', ids: ['sessions', 'messages_sent', 'independent_starts', 'class_independent_starts'] });
    expect(r.sessions?.value).toBe(DEMO_SESSIONS);
    expect(r.messages_sent?.value).toBe(DEMO_MESSAGES);
    expect(r.independent_starts?.locked).toBe(false);
    expect(r.class_independent_starts?.locked).toBe(false);
  });
  it('refuses a non-fictional learner', () => {
    db.run('UPDATE learners SET is_fictional = 0');
    expect(() => loadDemoData(db)).toThrow();
  });
});

describe('reports (R-01 to R-04)', () => {
  beforeEach(() => loadDemoData(db));

  it.each([
    ['parent', 'Parent report', 'Words used most'],
    ['slp', 'SLP report', 'Communication functions'],
    ['educator', 'School report', 'Words used in class'],
    ['ot', 'OT report', 'Interaction pattern'],
  ] as const)('%s report renders glance and its sections', async (role, title, heading) => {
    await renderScreen(<ReportScreen role={role} />, { db, role });
    expect((await screen.findAllByText(title)).length).toBeGreaterThan(0);
    expect(await screen.findByTestId('report-glance')).toBeTruthy();
    expect(screen.getAllByText(heading).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sample data').length).toBeGreaterThan(0);
  });

  it('a role cannot open another role report', async () => {
    await renderScreen(<ReportScreen role="parent" />, { db, role: 'educator' });
    expect(await screen.findByText('Not available for your role')).toBeTruthy();
  });

  it('shows the empty state when the period has no sessions', async () => {
    deleteAllRecords(db, 'parent');
    await renderScreen(<ReportScreen role="parent" />, parent());
    expect(await screen.findByText('Not enough data yet')).toBeTruthy();
  });

  it('educator report excludes parent-only words from other roles (role isolation)', async () => {
    await renderScreen(<ReportScreen role="educator" />, { db, role: 'educator' });
    await screen.findByTestId('report-glance');
    expect(screen.queryByText('What the messages were for')).toBeNull();
  });
});

describe('dashboard, builder, history, share', () => {
  beforeEach(() => loadDemoData(db));

  it('dashboard shows 9 sessions and 83 messages', async () => {
    await renderScreen(<DashboardScreen onOpenReport={() => undefined} onBuild={() => undefined} />, parent());
    expect(await screen.findByText('Reports by role')).toBeTruthy();
    expect(screen.getAllByText('83').length).toBeGreaterThan(0);
    expect(screen.getAllByText('9').length).toBeGreaterThan(0);
  });

  it('builder lists sections and saves defaults', async () => {
    await renderScreen(<BuilderScreen onOpen={() => undefined} />, parent());
    await fireEvent.press(await screen.findByText('Save as default for this reader'));
    const row = db.get<{ value: string }>("SELECT value FROM settings WHERE key = 'report.defaults.parent'");
    expect(JSON.parse(row?.value ?? '[]')).toEqual(expect.arrayContaining(['words', 'functions']));
  });

  it('history lists messages and filters', async () => {
    await renderScreen(<HistoryScreen />, parent());
    await waitFor(() => expect(screen.queryAllByText(/symbols/).length).toBeGreaterThan(0));
    await fireEvent.press(screen.getByText('Stored phrases'));
    await waitFor(() => expect(screen.queryAllByText(/symbols/).length).toBeGreaterThan(0));
  });

  it('history is hidden from a role without the history permission', async () => {
    await renderScreen(<HistoryScreen />, { db, role: 'educator' });
    expect(await screen.findByText('Not available for your role')).toBeTruthy();
  });

  it('share asks for consent on every path, then logs the export (no content)', async () => {
    const calls: string[] = [];
    const exporter = jest.fn(async (html: string, dest: string) => {
      calls.push(dest);
      expect(html).not.toContain('http');
    });
    await renderScreen(<ShareScreen role="parent" period={periodFor('7d')} exporter={exporter} />, parent());
    for (const [label, dest] of [['Save on this device', 'save'], ['Share with another app', 'share'], ['Print', 'print']] as const) {
      await fireEvent.press(await screen.findByText(label));
      expect(await screen.findByText('Share this report?')).toBeTruthy();
      await fireEvent.press(screen.getByText('Confirm and share'));
      await waitFor(() => expect(calls).toContain(dest));
    }
    await waitFor(() => expect(db.all('SELECT * FROM report_exports')).toHaveLength(3));
    const row = db.get<Record<string, unknown>>('SELECT * FROM report_exports LIMIT 1');
    expect(Object.keys(row ?? {})).toEqual(['id', 'role', 'period_start', 'period_end', 'destination', 'consent_at', 'exported_at']);
  });

  it('cancelling the consent dialog exports nothing', async () => {
    const exporter = jest.fn(async () => undefined);
    await renderScreen(<ShareScreen role="parent" period={periodFor('7d')} exporter={exporter} />, parent());
    await fireEvent.press(await screen.findByText('Print'));
    await fireEvent.press(await screen.findByText('Cancel'));
    expect(exporter).not.toHaveBeenCalled();
    expect(db.all('SELECT * FROM report_exports')).toHaveLength(0);
  });

  it('a role without export permission cannot share', async () => {
    await renderScreen(<ShareScreen role="ot" period={periodFor('7d')} exporter={jest.fn()} />, { db, role: 'ot' });
    expect(await screen.findByText('Not available for your role')).toBeTruthy();
  });
});

describe('sessions screens', () => {
  it('adult home shows an empty review list', async () => {
    await renderScreen(<AdultHomeScreen learnerId={TEST_LEARNER} onStart={() => undefined} onReview={() => undefined} />, parent());
    expect(await screen.findByText('Nothing to review')).toBeTruthy();
  });

  it('adult home lists unreviewed sessions', async () => {
    loadDemoData(db);
    await renderScreen(<AdultHomeScreen learnerId={TEST_LEARNER} onStart={() => undefined} onReview={() => undefined} />, parent());
    expect(await screen.findByText('Sessions to review (9)')).toBeTruthy();
  });

  it('start session stores the chosen setting', async () => {
    const started = jest.fn();
    await renderScreen(<StartSessionScreen learnerName="Demo Learner" learnerId={TEST_LEARNER} onStarted={started} />, parent());
    await fireEvent.press(await screen.findByText('School'));
    await fireEvent.press(screen.getByText('Start'));
    await waitFor(() => expect(started).toHaveBeenCalled());
    const row = db.get<{ setting: string }>('SELECT setting FROM app_sessions WHERE id = ?', [started.mock.calls[0][0]]);
    expect(row?.setting).toBe('school');
  });

  it('review session saves and removes the session from the review list', async () => {
    loadDemoData(db);
    const sid = listUnreviewedSessions(db, TEST_LEARNER)[0]!.id;
    const done = jest.fn();
    await renderScreen(<ReviewSessionScreen sessionId={sid} onDone={done} />, parent());
    await fireEvent.press(await screen.findByText('Save review'));
    await waitFor(() => expect(listUnreviewedSessions(db, TEST_LEARNER).some((s) => s.id === sid)).toBe(false));
  });

  it('review: an ot role sees the setup note field, an educator does not', async () => {
    loadDemoData(db);
    const sid = listUnreviewedSessions(db, TEST_LEARNER)[0]!.id;
    const a = await renderScreen(<ReviewSessionScreen sessionId={sid} onDone={() => undefined} />, { db, role: 'ot' });
    expect(await screen.findByText('Setup note')).toBeTruthy();
    await a.unmount();
    await renderScreen(<ReviewSessionScreen sessionId={sid} onDone={() => undefined} />, { db, role: 'educator' });
    await screen.findByText('Save review');
    expect(screen.queryByText('Setup note')).toBeNull();
  });
});

describe('goals, profile, roles, privacy', () => {
  it('goals list, empty and populated', async () => {
    const a = await renderScreen(<GoalsScreen learnerId={TEST_LEARNER} onAdd={() => undefined} onEdit={() => undefined} />, parent());
    expect(await screen.findByText('No goals yet')).toBeTruthy();
    await a.unmount();
    createGoal(db, { learnerId: TEST_LEARNER, title: 'Ask for help', role: 'slp', targetCount: 2, targetPeriod: 'week', visibleTo: ['parent'] });
    await renderScreen(<GoalsScreen learnerId={TEST_LEARNER} onAdd={() => undefined} onEdit={() => undefined} />, parent());
    expect(await screen.findByText('Ask for help')).toBeTruthy();
  });

  it('goal edit creates a goal', async () => {
    const done = jest.fn();
    await renderScreen(<GoalEditScreen learnerId={TEST_LEARNER} onDone={done} />, parent());
    await fireEvent.changeText(await screen.findByLabelText('Goal'), 'Greet a friend');
    await fireEvent.press(screen.getByText('Save'));
    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(db.all('SELECT * FROM goals')).toHaveLength(1);
  });

  it('learner profile: parent can edit hand; slp cannot', async () => {
    const a = await renderScreen(<LearnerProfileScreen />, parent());
    await fireEvent.press(await screen.findByText('Left'));
    expect(db.get<{ hand: string }>('SELECT hand FROM learners')?.hand).toBe('left');
    await a.unmount();
    await renderScreen(<LearnerProfileScreen />, { db, role: 'slp' });
    await fireEvent.press(await screen.findByText('Right'));
    expect(db.get<{ hand: string }>('SELECT hand FROM learners')?.hand).toBe('left');
  });

  it('roles: parent toggles a permission, others cannot', async () => {
    const a = await renderScreen(<RolesPermissionsScreen />, parent());
    await screen.findAllByText('See message history');
    expect(screen.queryByText('Only the guardian can change this')).toBeNull();
    await a.unmount();
    await renderScreen(<RolesPermissionsScreen />, { db, role: 'slp' });
    expect(await screen.findByText('Only the guardian can change this')).toBeTruthy();
  });

  it('privacy: parent deletes all records after PIN; others see no delete button', async () => {
    loadDemoData(db);
    saveConsent(db, TEST_LEARNER, { guardianConsent: true }, 'parent');
    const a = await renderScreen(<PrivacyConsentScreen />, { db, role: 'slp' });
    await screen.findByText('Privacy and consent');
    expect(screen.queryByText('Delete all records')).toBeNull();
    await a.unmount();
    await renderScreen(<PrivacyConsentScreen />, parent());
    await fireEvent.press(await screen.findByText('Delete all records'));
    expect(await screen.findByTestId('pin-confirm')).toBeTruthy();
    expect(getConsent(db, TEST_LEARNER)?.guardian_consent_at).toBeTruthy();
  });
});

describe('settings screens', () => {
  it('settings list shows reset demo only for a fictional learner and the parent', async () => {
    const a = await renderScreen(<SettingsListScreen onOpen={() => undefined} />, parent());
    expect(await screen.findByText('Reset demonstration data')).toBeTruthy();
    await a.unmount();
    await renderScreen(<SettingsListScreen onOpen={() => undefined} />, { db, role: 'slp' });
    await screen.findByText('Settings');
    expect(screen.queryByText('Reset demonstration data')).toBeNull();
  });

  it('child view settings persist the grid size', async () => {
    await renderScreen(<ChildViewSettingsScreen />, parent());
    await fireEvent.press(await screen.findByText('5x6'));
    expect(db.get<{ grid_size: string }>('SELECT grid_size FROM learners')?.grid_size).toBe('5x6');
  });

  it('voice and audio shows a voice status', async () => {
    await renderScreen(<VoiceAudioScreen />, parent());
    expect(await screen.findByText('No Sinhala voice; recorded clips only')).toBeTruthy();
    expect(screen.getByText('0 recorded clips installed')).toBeTruthy();
  });

  it('data and retention: non-parent sees no delete buttons', async () => {
    await renderScreen(<DataRetentionScreen />, { db, role: 'slp' });
    await screen.findByText('Only the guardian can change this');
    expect(screen.queryByText('Delete all records')).toBeNull();
  });

  it('about shows versions; export log is parent only', async () => {
    const a = await renderScreen(<AboutScreen />, parent());
    expect(await screen.findByText('Export error log')).toBeTruthy();
    expect(screen.getByText('1.0.0')).toBeTruthy();
    await a.unmount();
    await renderScreen(<AboutScreen />, { db, role: 'slp' });
    await screen.findByText('App version');
    expect(screen.queryByText('Export error log')).toBeNull();
  });

  it('vocabulary lists every symbol of the active version', async () => {
    await renderScreen(<VocabularyScreen />, parent());
    expect(await screen.findByText('Draft vocabulary. Labels are checked by a speech-language pathologist before release.')).toBeTruthy();
    expect(screen.getByLabelText('වතුර, water')).toBeTruthy();
  });
});

describe('error state (T-163)', () => {
  it('shows the generic error and Try again when the repository fails', async () => {
    db.run('DROP TABLE goal_progress');
    db.run('DROP TABLE goals');
    await renderScreen(<GoalsScreen learnerId={TEST_LEARNER} onAdd={() => undefined} onEdit={() => undefined} />, parent());
    expect(await screen.findByText('Something went wrong. Your records are safe. Please try again.')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    void act;
  });
});
