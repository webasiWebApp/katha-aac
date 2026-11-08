import {
  SLOT,
  buttonStates,
  composerReducer,
  initialComposerState,
  type ComposerAction,
  type ComposerState,
  type Effect,
  type TemplateInfo,
} from '../domain/composer';
import { highlightSchedule } from '../domain/highlight';

const TPL: TemplateInfo = { id: 'tpl_want', pattern: ['sym_me', SLOT, 'sym_want'], slotCategories: ['thing', 'action'] };

type Tap = Extract<ComposerAction, { type: 'tapWord' }>;
const tap = (symbolId: string, over: Partial<Tap> = {}): Tap => ({
  type: 'tapWord',
  symbolId,
  source: 'grid',
  pageId: 'home',
  positionIndex: 0,
  category: 'thing',
  template: null,
  now: 1000,
  newDraftId: 'd1',
  ...over,
});

function run(actions: ComposerAction[], start: ComposerState = initialComposerState) {
  let state = start;
  const effects: Effect[] = [];
  for (const a of actions) {
    const r = composerReducer(state, a);
    state = r.state;
    effects.push(...r.effects);
  }
  return { state, effects };
}
const evTypes = (e: Effect[]) => e.filter((x) => x.kind === 'event').map((x) => (x.kind === 'event' ? x.event.type : ''));

describe('composerReducer', () => {
  it('tap appends, emits symbol_selected and speaks the word', () => {
    const { state, effects } = run([tap('sym_water')]);
    expect(state.mode).toBe('draft');
    expect(state.items.map((i) => i.symbolId)).toEqual(['sym_water']);
    expect(state.draftId).toBe('d1');
    expect(evTypes(effects)).toEqual(['symbol_selected']);
    expect(effects.some((e) => e.kind === 'speakWord')).toBe(true);
  });

  it('opens a template when the draft is empty and the trigger is tapped', () => {
    const { state, effects } = run([tap('sym_want', { category: 'action', template: TPL })]);
    expect(state.items.map((i) => i.symbolId)).toEqual(['sym_me', SLOT, 'sym_want']);
    expect(state.templateId).toBe('tpl_want');
    expect(evTypes(effects)).toEqual(['template_opened', 'symbol_selected']);
    expect(buttonStates(state).speak).toBe(false); // slot empty
    expect(buttonStates(state).undo).toBe(false); // no child items
  });

  it('fills the slot with an allowed category', () => {
    const { state } = run([
      tap('sym_want', { category: 'action', template: TPL }),
      tap('sym_water', { category: 'thing', now: 1500 }),
    ]);
    expect(state.items.map((i) => i.symbolId)).toEqual(['sym_me', 'sym_water', 'sym_want']);
    expect(buttonStates(state).speak).toBe(true);
  });

  it('rejects a slot word with a wrong category and changes nothing visible', () => {
    const { state, effects } = run([
      tap('sym_want', { category: 'action', template: TPL }),
      tap('sym_finished', { category: 'describing' }),
    ]);
    expect(state.items.map((i) => i.symbolId)).toEqual(['sym_me', SLOT, 'sym_want']);
    expect(evTypes(effects)).toEqual(['template_opened', 'symbol_selected', 'template_rejected']);
  });

  it('undo of the slot word empties the slot; template words are not removable', () => {
    const { state, effects } = run([
      tap('sym_want', { category: 'action', template: TPL }),
      tap('sym_water', { category: 'thing', now: 1100 }),
      { type: 'undo', now: 1500, pageId: 'home' },
    ]);
    expect(state.items.map((i) => i.symbolId)).toEqual(['sym_me', SLOT, 'sym_want']);
    expect(composerReducer(state, { type: 'undo', now: 1600, pageId: 'home' }).effects).toEqual([]);
    const undo = effects.find((e) => e.kind === 'event' && e.event.type === 'undo');
    expect(undo?.kind === 'event' && undo.event.payload).toEqual({ quickUndo: true });
  });

  it('quickUndo flag is false after 2000 ms', () => {
    const { effects } = run([tap('sym_water'), { type: 'undo', now: 3500, pageId: 'home' }]);
    const undo = effects.find((e) => e.kind === 'event' && e.event.type === 'undo');
    expect(undo?.kind === 'event' && undo.event.payload).toEqual({ quickUndo: false });
  });

  it('clear with items emits clear, draft_abandoned, exploration_flagged', () => {
    const { state, effects } = run([tap('sym_water'), { type: 'clear', pageId: 'home' }]);
    expect(evTypes(effects)).toEqual(['symbol_selected', 'clear', 'draft_abandoned', 'exploration_flagged']);
    expect(state).toEqual(initialComposerState);
  });

  it('clear on an empty draft emits nothing', () => {
    expect(run([{ type: 'clear', pageId: 'home' }]).effects).toEqual([]);
  });

  it('submit commits, speaks, then shows the submitted message', () => {
    let r = run([tap('sym_me', { category: 'people' }), tap('sym_water', { newDraftId: 'dX' }), { type: 'speakRequested', messageId: 'm1', text: 't' }]);
    expect(r.state.mode).toBe('committing');
    expect(r.effects.filter((e) => e.kind === 'commit')).toHaveLength(1);
    expect(composerReducer(r.state, { type: 'speakRequested', messageId: 'm2', text: 't' }).effects).toEqual([]); // disabled while committing
    r = run([{ type: 'commitSucceeded' }], r.state);
    expect(r.state.mode).toBe('speaking');
    expect(r.effects[0]?.kind).toBe('speakMessage');
    r = run([{ type: 'speakFinished' }], r.state);
    expect(r.state.mode).toBe('showingSubmitted');
    expect(buttonStates(r.state).replay).toBe(true);
  });

  it('replay never creates a message', () => {
    const shown = run([tap('sym_water'), { type: 'speakRequested', messageId: 'm1', text: 't' }, { type: 'commitSucceeded' }, { type: 'speakFinished' }]).state;
    const r = run([{ type: 'replayRequested' }], shown);
    expect(r.effects.some((e) => e.kind === 'commit')).toBe(false);
    expect(evTypes(r.effects)).toEqual(['message_replayed']);
    expect(r.effects.some((e) => e.kind === 'speakMessage' && e.audioKind === 'message_replay')).toBe(true);
  });

  it('next tap after submit starts a new draft', () => {
    const shown = run([tap('sym_water'), { type: 'speakRequested', messageId: 'm1', text: 't' }, { type: 'commitSucceeded' }, { type: 'speakFinished' }]).state;
    const r = run([tap('sym_milk', { newDraftId: 'd2' })], shown);
    expect(r.state.draftId).toBe('d2');
    expect(r.state.items.map((i) => i.symbolId)).toEqual(['sym_milk']);
    expect(r.state.submitted).toBeUndefined();
  });

  it('commit failure returns to the draft', () => {
    const r = run([tap('sym_water'), { type: 'speakRequested', messageId: 'm1', text: 't' }, { type: 'commitFailed' }]);
    expect(r.state.mode).toBe('draft');
    expect(r.state.items).toHaveLength(1);
  });

  it('stored phrase commits at once with a null draft id', () => {
    const r = run([{ type: 'tapStoredPhrase', phraseId: 'phr_help', text: 'x', pageId: 'quick', positionIndex: 0, now: 1, messageId: 'm9' }]);
    const sel = r.effects.find((e) => e.kind === 'event' && e.event.type === 'symbol_selected');
    expect(sel?.kind === 'event' && [sel.event.source, sel.event.draftId]).toEqual(['quick', null]);
    const commit = r.effects.find((e) => e.kind === 'commit');
    expect(commit?.kind === 'commit' && [commit.messageKind, commit.draftId]).toEqual(['stored_phrase', null]);
  });

  it('speak disabled for an empty draft', () => {
    expect(buttonStates(initialComposerState)).toEqual({ speak: false, replay: false, undo: false, clear: false });
  });
});

describe('highlightSchedule', () => {
  it('evenly spaces chips', () => {
    expect(highlightSchedule(3, 3000)).toEqual([0, 1000, 2000]);
    expect(highlightSchedule(0, 3000)).toEqual([]);
  });
  it('reduced motion highlights at once', () => {
    expect(highlightSchedule(3, 3000, true)).toEqual([0, 0, 0]);
  });
});
