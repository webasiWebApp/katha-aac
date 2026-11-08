import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';

import { useDb } from '@/core/db';
import { emit } from '@/core/events/bus';
import { getSetting } from '@/core/db/settings';
import { getNavLabel } from '@/core/i18n';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { childText, useTheme } from '@/core/theme';
import type { AudioOutcome, GridSize } from '@/core/types/common';
import { AdultDot, getAudioService } from '@/features/audio/index';
import {
  ChildButton,
  MessageBar,
  highlightSchedule,
  useComposer,
  labelOfId,
  SLOT,
  type MessageBarSymbol,
  type SentencePart,
} from '@/features/composer/index';
import { appendEvent } from '@/features/event-log/index';
import { IntentConfirmChip } from '@/features/observations/index';
import {
  Pictogram,
  getActiveVocabulary,
  type PictogramName,
  type VocabularyContent,
} from '@/features/vocabulary/index';
import { boardMetrics, computeGrid, layoutMode, type GridResult } from '../domain/gridLayout';
import {
  GATE_AREA,
  gateStateMachine,
  type GateState,
  type Point,
} from '../domain/gateStateMachine';
import { CoreKeyRow, type CoreKeyRowItem } from './CoreKeyRow';
import { SymbolCell } from './SymbolCell';
import { useChildModeLock } from './useChildModeLock';

export interface BoardScreenProps {
  sessionId: string;
  learnerId: string;
  hand: 'right' | 'left';
  gridSize: GridSize;
  idleReturnSeconds: number;
  reducedMotion: boolean;
  /** Called when the two-finger 3 s adult gate completes. */
  onGate: () => void;
  /** Override the measured screen size (tests). */
  size?: { width: number; height: number };
}

const AUDIO_DOT_MS = 10_000;
const CHECK_CHIP_MS = 6_000;
const BREAK_KEY_DELAY_MS = 3_000;
const MSG_ROW = 96;

export function BoardScreen(props: BoardScreenProps) {
  const win = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Tests pass an explicit size; real devices lose the notch / home-indicator areas.
  const inset = props.size ? { top: 0, bottom: 0, left: 0, right: 0 } : insets;
  const width = (props.size?.width ?? win.width) - inset.left - inset.right;
  const height = (props.size?.height ?? win.height) - inset.top - inset.bottom;
  return <Board {...props} width={width} height={height} inset={inset} />;
}

function Board(props: BoardScreenProps & { width: number; height: number; inset: { top: number; bottom: number; left: number; right: number } }) {
  const { colors } = useTheme();
  const db = useDb();
  const { sessionId, learnerId, hand, reducedMotion, width, height, inset } = props;
  const mode = layoutMode(width, height);
  const m = boardMetrics(mode);
  const vocabulary = useMemo(() => getActiveVocabulary(db), [db]);
  const audio = useMemo(() => getAudioService(db), [db]);
  const adultCheck = useMemo(() => getSetting<boolean>(db, 'childView.adultCheck', true), [db]);

  useChildModeLock();

  const [pageId, setPageId] = useState('home');
  const pageRef = useRef('home');
  pageRef.current = pageId;
  const [audioDot, setAudioDot] = useState(false);
  const [breakAt, setBreakAt] = useState<number | null>(null);
  const [breakKey, setBreakKey] = useState(false);
  const [checkFor, setCheckFor] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(-1);

  const grid = useMemo(
    () => computeGrid({ width, height, gridSize: props.gridSize, mode }),
    [width, height, props.gridSize, mode],
  );
  useEffect(() => {
    if (grid.fellBack) logError('board', 'grid_too_small', new Error(props.gridSize));
  }, [grid.fellBack, props.gridSize]);

  const emitEvent = useCallback(
    (type: 'page_opened' | 'break_started' | 'break_ended' | 'idle_return', extra: { pageId?: string; payload?: Record<string, unknown> }) => {
      try {
        appendEvent(db, { sessionId, learnerId, type, pageId: extra.pageId ?? pageRef.current, payload: extra.payload });
      } catch (e) {
        logError('board', 'event_write_failed', e);
      }
    },
    [db, sessionId, learnerId],
  );

  const onAudioOutcome = useCallback((o: AudioOutcome) => {
    if (o === 'failed' || o === 'unsupported') {
      setAudioDot(true);
    }
  }, []);
  useEffect(() => {
    if (!audioDot) return undefined;
    const id = setTimeout(() => setAudioDot(false), AUDIO_DOT_MS);
    return () => clearTimeout(id);
  }, [audioDot]);

  const composer = useComposer({
    db,
    sessionId,
    learnerId,
    vocabulary,
    audio,
    getPageId: () => pageRef.current,
    onAudioOutcome,
  });
  const { state } = composer;

  // ── Idle return ────────────────────────────────────────────────────────────
  const lastTouch = useRef(Date.now());
  const touched = () => {
    lastTouch.current = Date.now();
  };
  useEffect(() => {
    if (props.idleReturnSeconds <= 0 || pageId === 'home' || breakAt !== null) return undefined;
    const ms = props.idleReturnSeconds * 1000;
    const id = setInterval(() => {
      const idle = Date.now() - lastTouch.current;
      if (idle >= ms) {
        const from = pageRef.current;
        emitEvent('idle_return', { pageId: from, payload: { idleMs: idle } });
        setPageId('home');
        pageRef.current = 'home';
        emitEvent('page_opened', { pageId: 'home', payload: { via: 'idle_return' } });
        lastTouch.current = Date.now();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [props.idleReturnSeconds, pageId, breakAt, emitEvent]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const openPage = useCallback(
    (id: string, via: 'folder' | 'home_key' | 'quick_key' | 'break_end') => {
      setPageId(id);
      pageRef.current = id;
      emitEvent('page_opened', { pageId: id, payload: { via } });
    },
    [emitEvent],
  );

  const startBreak = () => {
    setBreakAt(Date.now());
    setBreakKey(false);
    emitEvent('break_started', {});
    void audio
      .speakWord('nav_break', labelOfId(vocabulary, 'nav_break'), { sessionId })
      .catch((e: unknown) => logError('audio', 'speak_word_failed', e));
  };
  useEffect(() => {
    if (breakAt === null) return undefined;
    const id = setTimeout(() => setBreakKey(true), BREAK_KEY_DELAY_MS);
    return () => clearTimeout(id);
  }, [breakAt]);
  const endBreak = () => {
    emitEvent('break_ended', { payload: { durationMs: Date.now() - (breakAt ?? Date.now()) } });
    setBreakAt(null);
    setBreakKey(false);
    openPage('home', 'break_end');
  };

  // ── Page cells ─────────────────────────────────────────────────────────────
  const page = vocabulary.pages.find((p) => p.id === pageId) ?? vocabulary.pages[0];
  const capacity = grid.cols * grid.rows;
  useEffect(() => {
    if (page && page.cells.length > capacity) logError('vocabulary', 'page_overflow', new Error(page.id));
  }, [page, capacity]);
  const cells = useMemo(() => {
    const raw = (page?.cells ?? []).slice(0, capacity);
    while (raw.length < capacity) raw.push(null);
    return raw;
  }, [page, capacity]);
  const lastHidden = (() => {
    for (let i = cells.length - 1; i >= 0; i--) if (cells[i] === null) return i;
    return -1;
  })();

  // Cell presses go through a ref so the memoised grid keeps a stable callback and does not
  // re-render on composer changes (T-161).
  const cellPress = useRef<(id: string, index: number) => void>(() => undefined);
  useLayoutEffect(() => {
    cellPress.current = (id: string, index: number) => {
      const opens = vocabulary.folders.find((f) => f.symbolId === id)?.opensPage;
      if (opens) {
        openPage(opens, 'folder');
      } else if (!vocabulary.symbols.some((s) => s.id === id) && vocabulary.storedPhrases.some((p) => p.id === id)) {
        composer.tapPhrase(id, index);
      } else {
        composer.tapWord(id, 'grid', index);
      }
    };
  });
  const onCellPress = useCallback((id: string, index: number) => cellPress.current(id, index), []);

  // ── Core keys ──────────────────────────────────────────────────────────────
  const coreKey = (k: string, kind: 'core' | 'nav', onPress: () => void): CoreKeyRowItem | null => {
    const id = vocabulary.coreKeys[k];
    const sym = vocabulary.symbols.find((s) => s.id === id);
    if (!id || !sym) return null;
    return { id: k, kind, label: sym.label, pictogram: sym.pictogram as PictogramName, onPress };
  };
  const coreWord = (k: string) => coreKey(k, 'core', () => composer.tapWord(vocabulary.coreKeys[k] as string, 'core', -1));
  const keys = [
    coreKey('home', 'nav', () => openPage('home', 'home_key')),
    coreKey('quick', 'nav', () => openPage('quick', 'quick_key')),
    coreWord('help'),
    coreWord('more'),
    coreWord('stop'),
    coreWord('yes'),
    coreWord('no'),
    coreKey('break', 'nav', startBreak),
  ].filter((k): k is CoreKeyRowItem => k !== null);

  // ── Message bar ────────────────────────────────────────────────────────────
  const shown: string[] =
    state.mode === 'speaking' || state.mode === 'showingSubmitted'
      ? (state.submitted?.symbolIds ?? [])
      : state.items.map((i) => i.symbolId);
  const symbolsForBar: MessageBarSymbol[] = shown.map((id, i) => {
    if (id === SLOT) {
      return { kind: 'slot', id: `slot-${i}`, state: 'empty', pictogram: 'want', accessibilityLabel: t('board.slot') };
    }
    const sym = vocabulary.symbols.find((s) => s.id === id);
    const phrase = vocabulary.storedPhrases.find((p) => p.id === id);
    return {
      kind: 'chip',
      id: `${id}-${i}`,
      pictogram: (sym?.pictogram ?? phrase?.pictogram ?? 'me') as PictogramName,
      label: sym?.label ?? phrase?.label ?? id,
      speaking: state.mode === 'speaking' && highlight === i,
    };
  });
  const sentence: SentencePart[] =
    shown.length === 0
      ? [{ text: ' ' }]
      : shown.map((id, i) => ({
          text: (i > 0 ? ' ' : '') + labelOfId(vocabulary, id),
          tone: id === SLOT ? 'faint' : state.mode === 'speaking' && highlight === i ? 'highlight' : 'normal',
        }));

  useEffect(() => {
    if (state.mode !== 'speaking') {
      setHighlight(-1);
      return undefined;
    }
    const n = state.submitted?.symbolIds.length ?? 0;
    const schedule = highlightSchedule(n, n * 700, reducedMotion);
    const timers = schedule.map((offset, i) => setTimeout(() => setHighlight(i), offset));
    return () => timers.forEach(clearTimeout);
  }, [state.mode, state.submitted, reducedMotion]);

  // ── Adult check chip ───────────────────────────────────────────────────────
  const prevMode = useRef(state.mode);
  useEffect(() => {
    if (prevMode.current === 'speaking' && state.mode === 'showingSubmitted' && adultCheck && lastHidden >= 0 && state.submitted) {
      setCheckFor(state.submitted.messageId);
    }
    prevMode.current = state.mode;
  }, [state.mode, state.submitted, adultCheck, lastHidden]);
  useEffect(() => {
    if (!checkFor) return undefined;
    const id = setTimeout(() => setCheckFor(null), CHECK_CHIP_MS);
    return () => clearTimeout(id);
  }, [checkFor]);
  useEffect(() => {
    if (state.mode === 'draft') setCheckFor(null);
  }, [state.mode]);
  const answer = (a: 'meant' | 'not_meant' | 'unsure') => {
    if (checkFor) void emit({ type: 'intent_answered', messageId: checkFor, answer: a });
    setCheckFor(null);
  };

  // ── Adult gate ─────────────────────────────────────────────────────────────
  const gate = useRef<GateState>({ phase: 'idle' });
  const gateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onGateTouch = (e: GestureResponderEvent) => {
    // Android gives an array; browsers give a TouchList, so copy it first. Browser touches have
    // no locationX/Y; pageX/Y equal them here because the gate area sits at the screen origin.
    const touches: Point[] = Array.from(e.nativeEvent.touches as ArrayLike<GestureResponderEvent['nativeEvent']>).map((tt) => ({
      id: String(tt.identifier),
      x: tt.locationX ?? tt.pageX,
      y: tt.locationY ?? tt.pageY,
    }));
    const before = gate.current;
    gate.current = gateStateMachine(before, { type: 'touches', touches, now: Date.now() });
    if (gate.current.phase === 'done') {
      gate.current = { phase: 'idle' };
      props.onGate();
    } else if (before.phase === 'idle' && gate.current.phase === 'holding') {
      gateTimer.current = setTimeout(() => {
        gate.current = gateStateMachine(gate.current, { type: 'tick', now: Date.now() });
        if (gate.current.phase === 'done') {
          gate.current = { phase: 'idle' };
          props.onGate();
        }
      }, 3000);
    } else if (gate.current.phase === 'idle' && gateTimer.current) {
      clearTimeout(gateTimer.current);
      gateTimer.current = null;
    }
  };
  useEffect(() => () => {
    if (gateTimer.current) clearTimeout(gateTimer.current);
  }, []);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const speaking = state.mode === 'speaking';
  const barState = audioDot ? 'audioFallback' : speaking ? 'speaking' : 'idle';
  const buttons = [
    <ChildButton key="clear" kind="clear" compactHeight={m.button ?? undefined} accessibilityLabel={t('board.a11y.clear')} accessibilityHint={t('board.a11y.clear_hint')} state={composer.buttons.clear ? 'default' : 'disabled'} onLongPress={composer.clear} />,
    <ChildButton key="undo" kind="undo" compactHeight={m.button ?? undefined} accessibilityLabel={t('board.a11y.undo')} state={composer.buttons.undo ? 'default' : 'disabled'} onPress={composer.undo} />,
    <ChildButton key="replay" kind="replay" compactHeight={m.button ?? undefined} accessibilityLabel={t('board.a11y.replay')} state={composer.buttons.replay ? 'default' : 'disabled'} onPress={composer.replay} />,
    <ChildButton key="speak" kind="speak" compactHeight={m.button ?? undefined} label={getNavLabel('speak')} accessibilityLabel={t('board.a11y.speak')} state={composer.buttons.speak ? 'default' : 'disabled'} onPress={composer.speak} />,
  ];
  const bar = (
    <View key="bar" style={mode === 'phonePortrait' ? undefined : styles.barWrap}>
      <MessageBar minHeight={m.bar} symbols={symbolsForBar} sentence={sentence} state={barState} accessibilityLabel={t('board.a11y.message_bar')} />
      {audioDot ? <AdultDot style={styles.audioDot} accessibilityLabel={t('board.a11y.audio_dot')} /> : null}
    </View>
  );
  const orderedButtons = hand === 'left' ? [...buttons].reverse() : buttons;
  const buttonGroup = <View key="buttons" style={mode === 'phoneLandscape' ? styles.buttonGroupLandscape : styles.buttonGroup}>{orderedButtons}</View>;
  const row = hand === 'left' ? [...orderedButtons].concat(bar) : [bar, ...orderedButtons];

  const chipPos = lastHidden >= 0 ? { row: Math.floor(lastHidden / grid.cols), col: lastHidden % grid.cols } : null;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.child.bg,
          gap: m.zoneGap,
          paddingTop: m.margin + inset.top,
          paddingBottom: m.margin + inset.bottom,
          paddingLeft: m.margin + inset.left,
          paddingRight: m.margin + inset.right,
        },
      ]}
      onTouchStart={touched}
      testID="board-root"
    >
      {mode === 'phonePortrait' ? (
        <>
          {bar}
          <View style={[styles.messageRow, { height: m.button ?? MSG_ROW }]}>{orderedButtons}</View>
        </>
      ) : mode === 'phoneLandscape' ? (
        <View style={[styles.messageRow, { height: m.messageBlock }]}>{hand === 'left' ? [buttonGroup, bar] : [bar, buttonGroup]}</View>
      ) : (
        <View style={[styles.messageRow, { height: MSG_ROW }]}>{row}</View>
      )}

      <View style={[styles.grid, { gap: grid.gap, opacity: speaking ? 0.7 : 1 }]} testID="board-grid">
        <BoardGrid cells={cells} grid={grid} vocabulary={vocabulary} onCellPress={onCellPress} />
        {checkFor && chipPos ? (
          <View
            testID="intent-chip"
            style={{
              position: 'absolute',
              top: chipPos.row * (grid.cellH + grid.gap) + (grid.cellH - 56) / 2,
              right: (grid.cols - 1 - chipPos.col) * (grid.cellW + grid.gap),
            }}
          >
            <IntentConfirmChip
              question={t('review.intent_chip')}
              meantLabel={t('intent.meant')}
              notMeantLabel={t('intent.not_meant')}
              unsureLabel={t('intent.unsure')}
              onMeant={() => answer('meant')}
              onNotMeant={() => answer('not_meant')}
              onUnsure={() => answer('unsure')}
            />
          </View>
        ) : null}
      </View>

      <CoreKeyRow keys={keys} hand={hand} keyHeight={m.coreKey ?? undefined} rows={m.coreRows} />

      <View
        style={styles.gate}
        onTouchStart={onGateTouch}
        onTouchMove={onGateTouch}
        onTouchEnd={onGateTouch}
        onTouchCancel={onGateTouch}
        testID="gate-area"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />

      {breakAt !== null ? (
        <View style={[StyleSheet.absoluteFill, styles.breakOverlay, { backgroundColor: colors.child.band }]} testID="break-overlay">
          <Pictogram symbol="break" size={160} />
          <Text style={[childText.message, { color: colors.child.ink }]}>{labelOfId(vocabulary, 'nav_break')}</Text>
          {breakKey ? (
            <Pressable
              onPress={endBreak}
              testID="break-home-key"
              accessibilityRole="button"
              accessibilityLabel={labelOfId(vocabulary, 'nav_home')}
              style={[styles.breakKey, { backgroundColor: colors.child.surface, borderColor: colors.child.cellBorder }]}
            >
              <Pictogram symbol="home" size={44} />
              <Text style={[childText.chip, { color: colors.child.ink }]}>{labelOfId(vocabulary, 'nav_home')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

interface BoardGridProps {
  cells: (string | null)[];
  grid: GridResult;
  vocabulary: VocabularyContent;
  onCellPress: (id: string, index: number) => void;
}

/** The symbol grid. Memoised: props change only on page, grid size or vocabulary changes. */
const BoardGrid = memo(function BoardGrid({ cells, grid, vocabulary, onCellPress }: BoardGridProps) {
  const renderCell = (id: string | null, index: number) => {
    const common = { size: 'L' as const, width: grid.cellW, height: grid.cellH };
    if (id === null) {
      return <SymbolCell key={`h${index}`} {...common} state="hidden" label="" pictogram="me" wordClass="thing" />;
    }
    const sym = vocabulary.symbols.find((s) => s.id === id);
    if (sym) {
      const opens = vocabulary.folders.some((f) => f.symbolId === id);
      return (
        <SymbolCell
          key={id}
          {...common}
          size={grid.labelPlacement === 'right' ? 'S' : grid.cols >= 5 ? 'M' : 'L'}
          label={sym.label}
          pictogram={sym.pictogram as PictogramName}
          wordClass={sym.category}
          opensPage={opens}
          onPress={() => onCellPress(id, index)}
        />
      );
    }
    const phrase = vocabulary.storedPhrases.find((p) => p.id === id);
    if (phrase) {
      return (
        <SymbolCell
          key={id}
          {...common}
          size={grid.cols >= 5 ? 'M' : 'L'}
          label={phrase.label}
          pictogram={phrase.pictogram as PictogramName}
          wordClass="core"
          onPress={() => onCellPress(id, index)}
        />
      );
    }
    return <SymbolCell key={`x${index}`} {...common} state="hidden" label="" pictogram="me" wordClass="thing" />;
  };
  return (
    <>
      {Array.from({ length: grid.rows }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: grid.gap }}>
          {cells.slice(r * grid.cols, (r + 1) * grid.cols).map((id, c) => renderCell(id, r * grid.cols + c))}
        </View>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, gap: 12 },
  buttonGroup: { flexDirection: 'row', gap: 8 },
  buttonGroupLandscape: { flexDirection: 'row', gap: 8, width: 300 },
  messageRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  barWrap: { flex: 1 },
  audioDot: { position: 'absolute', top: 4, right: 4 },
  grid: { flex: 1 },
  gate: { position: 'absolute', top: 0, left: 0, width: GATE_AREA, height: GATE_AREA },
  breakOverlay: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  breakKey: {
    width: 136,
    height: 96,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
