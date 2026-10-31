import { View } from 'react-native';

import { radius, size, useTheme } from '@/core/theme';
import type { WordClass } from '@/features/board';
import type { PictogramName } from '@/features/vocabulary';

import { StripCell, type StripCellState } from './StripCell';

export interface StripItem {
  id: string;
  /** verify with SLT */
  label: string;
  pictogram: PictogramName;
  wordClass: WordClass;
  state?: StripCellState;
  onPress: () => void;
}

export type PredictionStripProps =
  | {
      /** 3 or 4 predicted symbols above the fixed grid (condition C). */
      mode: 'items';
      items: readonly StripItem[];
    }
  | {
      /** Cold start: empty and calm, no message to the child (C-15). */
      mode: 'learning';
    }
  | {
      /** Conditions A and B reserve the same 1232 x 88 band so grid cells never move (C-04). */
      mode: 'calm';
    };

/**
 * Prediction strip (Figma 4:254), 88 dp high band on a distinct lavender background (R8).
 * Items / Learning use a dashed child/strip-border; the calm band is a plain child/band.
 */
export function PredictionStrip(props: PredictionStripProps) {
  const { colors } = useTheme();
  const calm = props.mode === 'calm';
  return (
    <View
      accessibilityElementsHidden={calm}
      importantForAccessibility={calm ? 'no-hide-descendants' : 'auto'}
      style={{
        height: size.stripBand,
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 8,
        borderRadius: radius.lg,
        backgroundColor: calm ? colors.child.band : colors.child.stripBg,
        ...(calm
          ? {}
          : {
              borderWidth: 2,
              borderColor: colors.child.stripBorder,
              borderStyle: 'dashed' as const,
            }),
      }}
    >
      {props.mode === 'items'
        ? props.items.map((item) => (
            <StripCell
              key={item.id}
              state={item.state}
              label={item.label}
              pictogram={item.pictogram}
              wordClass={item.wordClass}
              onPress={item.onPress}
            />
          ))
        : null}
    </View>
  );
}
