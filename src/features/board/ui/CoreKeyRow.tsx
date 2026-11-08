import { View } from 'react-native';

import type { PictogramName } from '@/features/vocabulary';

import { CoreKey, type CoreKeyKind } from './CoreKey';

export interface CoreKeyRowItem {
  id: string;
  kind: CoreKeyKind;
  /** Sinhala label. verify with SLT */
  label: string;
  pictogram: PictogramName;
  onPress: () => void;
}

export type Hand = 'right' | 'left';

export interface CoreKeyRowProps {
  /**
   * Keys in the canonical (right-handed) order from the design:
   * Home, Quick needs, help, more, stop, yes, no, Break.
   */
  keys: readonly CoreKeyRowItem[];
  /** Left-handed layout mirrors the row once at setup and then never moves (Figma 5:702). */
  hand?: Hand;
  /** Phone: key height in dp (default 88). */
  keyHeight?: number;
  /** Phone portrait: split the keys over two rows. */
  rows?: 1 | 2;
}

/** Row of fixed keys, 88 dp high, 12 dp gaps, keys share the width equally (Figma 5:702). */
export function CoreKeyRow({ keys, hand = 'right', keyHeight, rows = 1 }: CoreKeyRowProps) {
  const ordered = hand === 'left' ? [...keys].reverse() : keys;
  if (keyHeight !== undefined) {
    const half = Math.ceil(ordered.length / 2);
    return (
      <View accessibilityRole="toolbar" style={{ gap: 8 }}>
        {(rows === 2 ? [ordered.slice(0, half), ordered.slice(half)] : [ordered]).map((line, i) => (
          <View key={i} style={{ height: keyHeight, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {line.map((key) => (
              <CoreKey key={key.id} kind={key.kind} label={key.label} pictogram={key.pictogram} onPress={key.onPress} flex height={keyHeight} />
            ))}
          </View>
        ))}
      </View>
    );
  }
  return (
    <View
      accessibilityRole="toolbar"
      style={{ height: 88, flexDirection: 'row', gap: 12, alignItems: 'center' }}
    >
      {ordered.map((key) => (
        <CoreKey
          key={key.id}
          kind={key.kind}
          label={key.label}
          pictogram={key.pictogram}
          onPress={key.onPress}
          flex
        />
      ))}
    </View>
  );
}
