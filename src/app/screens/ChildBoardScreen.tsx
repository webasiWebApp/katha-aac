/**
 * C-02 · Child board · Home grid (Condition A, fixed 3×4 starter).
 *
 * Assembles the full child-facing screen:
 *   • MessageBar + action buttons  (top)
 *   • CoreKeyRow                   (middle)
 *   • 3×4 SymbolGrid               (bottom)
 *
 * State is local for now (Phase 4 placeholder).  The composer, event-log and
 * audio features will own these concerns once their domain layers are built.
 */
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { getNavLabel, getWordLabel } from '@/core/i18n';
import { childGeometry, size, useTheme } from '@/core/theme';
import { ChildButton, MessageBar, type MessageBarSymbol } from '@/features/composer';
import { CoreKeyRow, SymbolGrid, type CoreKeyRowItem, type GridCell } from '@/features/board';

// ─── Starter vocabulary (3×4 fixed grid, Figma C-02) ────────────────────────
// Row 1: me · want · happy · water
// Row 2: amma · eat · sad · milk
// Row 3: [hidden] · drink · [hidden] · kiribath
// Hidden cells keep the grid stable and will be unlocked by vocabulary versions later.

const STARTER_GRID: GridCell[] = [
  // Row 1
  { id: 'me',       pictogram: 'me',       label: getWordLabel('me'),       wordClass: 'people'    },
  { id: 'want',     pictogram: 'want',     label: getWordLabel('want'),     wordClass: 'core'      },
  { id: 'happy',    pictogram: 'happy',    label: getWordLabel('happy'),    wordClass: 'describing'},
  { id: 'water',    pictogram: 'water',    label: getWordLabel('water'),    wordClass: 'thing'     },
  // Row 2
  { id: 'amma',     pictogram: 'amma',     label: getWordLabel('amma'),     wordClass: 'people'    },
  { id: 'eat',      pictogram: 'eat',      label: getWordLabel('eat'),      wordClass: 'action'    },
  { id: 'sad',      pictogram: 'sad',      label: getWordLabel('sad'),      wordClass: 'describing'},
  { id: 'milk',     pictogram: 'milk',     label: getWordLabel('milk'),     wordClass: 'thing'     },
  // Row 3  (cols 1 & 3 are hidden)
  { id: 'hidden-1', pictogram: 'me',       label: '',                       wordClass: 'thing',    state: 'hidden' },
  { id: 'drink',    pictogram: 'drink',    label: getWordLabel('drink'),    wordClass: 'action'    },
  { id: 'hidden-3', pictogram: 'me',       label: '',                       wordClass: 'thing',    state: 'hidden' },
  { id: 'kiribath', pictogram: 'kiribath', label: getWordLabel('kiribath'), wordClass: 'thing'     },
];

// ─── Core key row ────────────────────────────────────────────────────────────
const CORE_KEYS: CoreKeyRowItem[] = [
  { id: 'home',  kind: 'nav',  label: getNavLabel('home'),  pictogram: 'home',      onPress: () => {} },
  { id: 'quick', kind: 'nav',  label: getNavLabel('quick'), pictogram: 'quick',     onPress: () => {} },
  { id: 'help',  kind: 'core', label: getWordLabel('help'), pictogram: 'help',      onPress: () => {} },
  { id: 'more',  kind: 'core', label: getWordLabel('more'), pictogram: 'more',      onPress: () => {} },
  { id: 'stop',  kind: 'core', label: getWordLabel('stop'), pictogram: 'stop',      onPress: () => {} },
  { id: 'yes',   kind: 'core', label: getWordLabel('yes'),  pictogram: 'yes',       onPress: () => {} },
  { id: 'no',    kind: 'core', label: getWordLabel('no'),   pictogram: 'no',        onPress: () => {} },
  { id: 'break', kind: 'nav',  label: getNavLabel('break'), pictogram: 'finished',  onPress: () => {} },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export function ChildBoardScreen() {
  const { colors } = useTheme();
  const [message, setMessage] = useState<MessageBarSymbol[]>([]);

  const addSymbol = (id: string, pictogram: string, label: string) => {
    setMessage((prev) => [
      ...prev,
      { kind: 'chip', id: `${id}-${Date.now()}`, pictogram: pictogram as any, label },
    ]);
  };

  const handleUndo = () => setMessage((prev) => prev.slice(0, -1));
  const handleClear = () => setMessage([]);
  const handleSpeak = () => {
    // Phase 4: trigger TTS via audio feature
    setMessage([]);
  };

  const sentence = message.length === 0
    ? [{ text: ' ' }]
    : [{ text: message.map((s) => ('label' in s ? s.label : '')).join(' ') }];

  const gridCells: GridCell[] = STARTER_GRID.map((cell) =>
    cell.state === 'hidden'
      ? cell
      : {
          ...cell,
          onPress: () => addSymbol(cell.id, cell.pictogram, cell.label),
        }
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.child.bg }]}>
      <View style={styles.board}>
        {/* ── Top row: message bar + action buttons ── */}
        <View style={styles.topRow}>
          <MessageBar
            symbols={message}
            sentence={sentence}
            accessibilityLabel="Message bar"
          />
          <View style={styles.actions}>
            <ChildButton
              kind="clear"
              accessibilityLabel="Clear message"
              accessibilityHint="Hold to clear"
              onLongPress={handleClear}
            />
            <ChildButton
              kind="undo"
              accessibilityLabel="Undo last symbol"
              onPress={handleUndo}
            />
            <ChildButton
              kind="speak"
              label={getNavLabel('speak')}
              accessibilityLabel="Speak message"
              onPress={handleSpeak}
            />
          </View>
        </View>

        <View style={{ height: childGeometry.zoneGap }} />

        {/* ── Core key row ── */}
        <CoreKeyRow keys={CORE_KEYS} />

        <View style={{ height: childGeometry.zoneGap }} />

        {/* ── 3×4 symbol grid ── */}
        <ScrollView contentContainerStyle={styles.gridContainer} scrollEnabled={false}>
          <SymbolGrid cells={gridCells} columns={4} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  board: {
    flex: 1,
    padding: size.childMargin,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: size.cellGap,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  gridContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
});
