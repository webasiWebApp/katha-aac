import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeTestDb, TEST_LEARNER } from '@/app/testing/testDb';
import { renderScreen } from '@/app/testing/renderApp';
import { resetBus, on } from '@/core/events/bus';
import type { GridSize } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import { BoardScreen } from '@/features/board/index';
import { getForMessages, initObservations } from '@/features/observations/index';
import { manifest as observationsManifest } from '@/features/observations/feature.manifest';
import { startSession } from '@/features/sessions/index';

let db: Db;
let sid: string;
const SIZE = { width: 1280, height: 800 };

beforeEach(async () => {
  resetBus();
  db = await makeTestDb();
  sid = startSession(db, { learnerId: TEST_LEARNER, setting: 'home', role: 'parent' });
});
afterEach(() => {
  jest.useRealTimers();
});

const board = (over: Partial<React.ComponentProps<typeof BoardScreen>> = {}) =>
  renderScreen(
    <BoardScreen
      sessionId={sid}
      learnerId={TEST_LEARNER}
      hand="right"
      gridSize="3x4"
      idleReturnSeconds={30}
      reducedMotion={false}
      onGate={over.onGate ?? (() => undefined)}
      size={SIZE}
      {...over}
    />,
    { db, role: null },
  );

const events = (type: string) => db.all<{ symbol_id: string | null; payload_json: string }>('SELECT symbol_id, payload_json FROM communication_events WHERE type = ?', [type]);
const tap = async (label: string) => fireEvent.press(screen.getByLabelText(label));

describe('board layout (T-072)', () => {
  it.each([
    ['3x4', 'right'],
    ['4x5', 'right'],
    ['5x6', 'right'],
    ['3x4', 'left'],
    ['5x6', 'left'],
  ] as const)('renders %s for the %s hand', async (gridSize: GridSize, hand) => {
    await board({ gridSize, hand });
    expect(screen.getByLabelText('මට')).toBeTruthy();
    expect(screen.getByTestId('board-grid')).toBeTruthy();
    expect(screen.getByLabelText('Speak message')).toBeTruthy();
    expect(screen.getByLabelText('Replay message')).toBeTruthy();
  });
});

describe('building and speaking (T-071, T-073, T-074)', () => {
  it('me + water + want then Speak writes 3 selections, 1 attempt, 1 submit, 1 message audio attempt', async () => {
    await board();
    await tap('මට');
    await tap('වතුර');
    await tap('උදව්'); // core key (source core)
    expect(events('symbol_selected')).toHaveLength(3);
    await tap('Speak message');
    await waitFor(() => expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(1));
    await waitFor(() => expect(db.all("SELECT * FROM audio_attempts WHERE kind = 'message_first'")).toHaveLength(1));
    expect(events('message_submitted')).toHaveLength(1);
    expect(db.all("SELECT * FROM audio_attempts WHERE kind = 'word'")).toHaveLength(3);
    const attempt = db.get<{ symbol_ids_json: string; kind: string }>('SELECT * FROM communication_attempts');
    expect(JSON.parse(attempt!.symbol_ids_json)).toEqual(['sym_me', 'sym_water', 'sym_help']);
    expect(attempt!.kind).toBe('built');
  });

  it('Speak is disabled for an empty draft and Replay never creates a message', async () => {
    await board();
    await tap('Speak message');
    expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(0);
    await tap('මට');
    await tap('Speak message');
    await waitFor(() => expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(1));
    await waitFor(() => expect(db.all("SELECT * FROM audio_attempts WHERE kind = 'message_first'")).toHaveLength(1));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    await tap('Replay message');
    await waitFor(() => expect(events('message_replayed')).toHaveLength(1));
    expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(1);
  });

  it('the next tap after a submitted message starts a new draft', async () => {
    await board();
    await tap('මට');
    await tap('Speak message');
    await waitFor(() => expect(db.all("SELECT * FROM audio_attempts WHERE kind = 'message_first'")).toHaveLength(1));
    await tap('වතුර');
    const drafts = new Set(db.all<{ draft_id: string }>("SELECT draft_id FROM communication_events WHERE type = 'symbol_selected'").map((r) => r.draft_id));
    expect(drafts.size).toBe(2);
  });

  it('undo removes the last symbol and records quickUndo', async () => {
    await board();
    await tap('මට');
    await tap('වතුර');
    await tap('Undo last symbol');
    const undo = events('undo');
    expect(undo).toHaveLength(1);
    expect(undo[0]!.symbol_id).toBe('sym_water');
    expect(JSON.parse(undo[0]!.payload_json)).toEqual({ quickUndo: true });
  });

  it('clear needs a long press: a short press does nothing, a long press abandons the draft', async () => {
    await board();
    await tap('මට');
    await tap('Clear message');
    expect(events('clear')).toHaveLength(0);
    await fireEvent(screen.getByLabelText('Clear message'), 'longPress');
    expect(events('clear')).toHaveLength(1);
    expect(events('draft_abandoned')).toHaveLength(1);
    expect(events('exploration_flagged')).toHaveLength(1);
  });

  it('template: want first opens "me ___ want"; wrong category is rejected; a thing fills the slot', async () => {
    await board();
    await tap('ඕනේ');
    expect(events('template_opened')).toHaveLength(1);
    await tap('Speak message');
    expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(0); // slot still empty
    await tap('ඉවරයි'); // describing -> rejected
    expect(events('template_rejected')).toHaveLength(1);
    await tap('වතුර');
    await tap('Speak message');
    await waitFor(() => expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(1));
    const a = db.get<{ symbol_ids_json: string; template_id: string }>('SELECT * FROM communication_attempts');
    expect(JSON.parse(a!.symbol_ids_json)).toEqual(['sym_me', 'sym_water', 'sym_want']);
    expect(a!.template_id).toBe('tpl_want');
  });

  it('quick page: a stored phrase is submitted at once; home key returns', async () => {
    await board();
    await tap('ඉක්මන්');
    expect(db.all("SELECT page_id FROM communication_events WHERE type = 'page_opened'").length).toBe(2);
    await tap('මට උදව් ඕනේ');
    await waitFor(() => expect(db.all('SELECT * FROM communication_attempts')).toHaveLength(1));
    const a = db.get<{ kind: string; draft_id: string | null }>('SELECT * FROM communication_attempts');
    expect([a!.kind, a!.draft_id]).toEqual(['stored_phrase', null]);
    await tap('ගෙදර');
    expect(screen.getByLabelText('මට')).toBeTruthy();
  });
});

describe('adult check chip (T-076)', () => {
  it('appears after speaking and writes an intent observation through the bus', async () => {
    initObservations(db);
    for (const h of observationsManifest.eventHandlers ?? []) on(h.event as 'intent_answered', h.handle as never);
    await board();
    await tap('මට');
    await tap('Speak message');
    const meant = await screen.findByLabelText('Meant', {}, { timeout: 3000 });
    await fireEvent.press(meant);
    const msg = db.get<{ id: string }>('SELECT id FROM communication_attempts');
    await waitFor(() => expect(getForMessages(db, [msg!.id]).map((o) => o.value)).toEqual(['meant']));
    expect(screen.queryByTestId('intent-chip')).toBeNull();
  });

  it('is not shown when the setting is off', async () => {
    db.run("INSERT INTO settings (key, value) VALUES ('childView.adultCheck', 'false')");
    await board();
    await tap('මට');
    await tap('Speak message');
    await waitFor(() => expect(db.all("SELECT * FROM audio_attempts WHERE kind = 'message_first'")).toHaveLength(1));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.queryByTestId('intent-chip')).toBeNull();
  });
});

describe('break, idle return, gate (T-077, T-078)', () => {
  it('break overlay shows, the home key appears after 3 s and closes it', async () => {
    jest.useFakeTimers();
    await board();
    await tap('විවේකය');
    expect(screen.getByTestId('break-overlay')).toBeTruthy();
    expect(db.all("SELECT * FROM communication_events WHERE type = 'break_started'")).toHaveLength(1);
    expect(screen.queryByTestId('break-home-key')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });
    await fireEvent.press(screen.getByTestId('break-home-key'));
    expect(screen.queryByTestId('break-overlay')).toBeNull();
    expect(db.all("SELECT * FROM communication_events WHERE type = 'break_ended'")).toHaveLength(1);
  });

  it('idle return goes home after the idle time and keeps the draft', async () => {
    jest.useFakeTimers();
    await board({ idleReturnSeconds: 15 });
    await tap('ඉක්මන්');
    await act(async () => {
      jest.advanceTimersByTime(16_000);
    });
    expect(db.all("SELECT * FROM communication_events WHERE type = 'idle_return'")).toHaveLength(1);
    expect(screen.getByLabelText('මට')).toBeTruthy();
  });

  it('two fingers held 3 s in the top-left area call onGate', async () => {
    jest.useFakeTimers();
    const onGate = jest.fn();
    await board({ onGate });
    const area = screen.getByTestId('gate-area', { includeHiddenElements: true });
    const touches = [
      { identifier: 1, locationX: 30, locationY: 30 },
      { identifier: 2, locationX: 60, locationY: 50 },
    ];
    await fireEvent(area, 'touchStart', { nativeEvent: { touches } });
    await act(async () => {
      jest.advanceTimersByTime(3100);
    });
    expect(onGate).toHaveBeenCalledTimes(1);
  });

  it('one finger never opens the gate', async () => {
    jest.useFakeTimers();
    const onGate = jest.fn();
    await board({ onGate });
    await fireEvent(screen.getByTestId('gate-area', { includeHiddenElements: true }), 'touchStart', { nativeEvent: { touches: [{ identifier: 1, locationX: 30, locationY: 30 }] } });
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(onGate).not.toHaveBeenCalled();
  });
});

describe('grid memoisation (T-161)', () => {
  it('does not re-render grid cells when the composer draft changes', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cellModule = require('@/features/board/ui/SymbolCell') as typeof import('@/features/board/ui/SymbolCell');
    const spy = jest.spyOn(cellModule, 'SymbolCell');
    await board();
    const afterMount = spy.mock.calls.length;
    expect(afterMount).toBeGreaterThan(0);
    await tap('මට');
    await tap('වතුර');
    expect(events('symbol_selected')).toHaveLength(2);
    // Only the message bar changes; the 12 grid cells keep their previous render.
    expect(spy.mock.calls.length).toBe(afterMount);
    spy.mockRestore();
  });
});
