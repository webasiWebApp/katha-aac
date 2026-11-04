import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { childText, childGeometry, facText, useTheme, type CellSize } from '@/core/theme';
import { cellFrameStyle, DISABLED_CONTENT_OPACITY, type CellFrameState } from '@/core/ui';
import { Pictogram, type PictogramName } from '@/features/vocabulary';

import { ClassTint, type WordClass } from './ClassTint';

export type SymbolCellState = 'default' | 'pressed' | 'selected' | 'hidden' | 'disabled' | 'new';

export interface SymbolCellProps {
  /** L = 3x4 grid (296x136), M = 4x5 (236x102), S = 5x6 (195x79, never under 72 dp). */
  size: CellSize;
  state?: SymbolCellState;
  /** Sinhala word label from the i18n labels. verify with SLT */
  label: string;
  pictogram: PictogramName;
  wordClass: WordClass;
  /** Folder corner: this cell opens a category page. */
  opensPage?: boolean;
  /** Text of the adult-only badge on state="new" (editor only), for example "NEW". */
  newBadgeLabel?: string;
  onPress?: () => void;
  /** Defaults to `label`. */
  accessibilityLabel?: string;
}

// Per-size layout read from Figma 4:167. Padding is measured from the outer edge (strokes sit
// inside the box in Figma), so the border width is subtracted to keep content from shifting.
const LAYOUT = {
  L: { radius: 16, picture: 72, direction: 'column', gap: 2, pad: { l: 8, r: 8, t: 14, b: 6 } },
  M: { radius: 14, picture: 48, direction: 'column', gap: 0, pad: { l: 8, r: 8, t: 12, b: 4 } },
  S: { radius: 12, picture: 48, direction: 'row', gap: 10, pad: { l: 12, r: 10, t: 10, b: 6 } },
} as const;

const LABEL_STYLE = { L: childText.labelL, M: childText.labelM, S: childText.labelS } as const;

/**
 * Vocabulary cell (Figma 4:167, 18 variants = 6 states x 3 sizes).
 * Presentational: the parent decides what a press does. Press feedback (blue border + glow) is
 * shown while the finger is down when state is "default".
 */
export function SymbolCell({
  size,
  state = 'default',
  label,
  pictogram,
  wordClass,
  opensPage = false,
  newBadgeLabel,
  onPress,
  accessibilityLabel,
}: SymbolCellProps) {
  const { colors } = useTheme();
  const layout = LAYOUT[size];
  const dims = childGeometry.cell[size];
  const interactive = onPress !== undefined && state !== 'hidden' && state !== 'disabled';

  const render = (pressed: boolean) => {
    const frameState: CellFrameState =
      state === 'default' || state === 'new' ? (pressed ? 'pressed' : 'default') : state;
    const frame = cellFrameStyle(colors, { state: frameState, radius: layout.radius });
    const bw = frame.borderWidth ?? 2;
    const contentOpacity =
      state === 'hidden' ? 0 : state === 'disabled' ? DISABLED_CONTENT_OPACITY : 1;

    const container: ViewStyle = {
      width: dims.width,
      height: dims.height,
      flexDirection: layout.direction,
      alignItems: 'center',
      justifyContent: 'center',
      gap: layout.gap,
      overflow: 'hidden',
      paddingLeft: Math.max(0, layout.pad.l - bw),
      paddingRight: Math.max(0, layout.pad.r - bw),
      paddingTop: Math.max(0, layout.pad.t - bw),
      paddingBottom: Math.max(0, layout.pad.b - bw),
      ...frame,
    };

    return (
      <View style={container}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: -bw, left: -bw, right: -bw, opacity: contentOpacity }}
        >
          <ClassTint wordClass={wordClass} testID="class-tint" />
        </View>
        <View style={{ opacity: contentOpacity }}>
          <Pictogram symbol={pictogram} size={layout.picture} />
        </View>
        <Text style={[LABEL_STYLE[size], { color: colors.child.ink, opacity: contentOpacity }]}>
          {label}
        </Text>
        {opensPage && state !== 'hidden' ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', right: -bw, bottom: -bw, opacity: contentOpacity }}
          >
            {/* Corner fold, 22 x 22. Path checked against Figma 4:23: M22 0V22H0L22 0Z, #52606D at 45 %. */}
            <Svg width={22} height={22} viewBox="0 0 22 22">
              <Path d="M22 0 L22 22 L0 22 Z" fill={colors.child.inkFaint} />
            </Svg>
          </View>
        ) : null}
        {state === 'new' && newBadgeLabel ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 12 - bw,
              right: 10 - bw,
              height: 21,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: colors.adult.chipBg,
              justifyContent: 'center',
            }}
          >
            <Text style={[facText.overline, { color: colors.adult.chipInk }]}>{newBadgeLabel}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (!interactive) {
    return (
      <View
        accessible={state !== 'hidden'}
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: state === 'disabled' }}
        accessibilityElementsHidden={state === 'hidden'}
        importantForAccessibility={state === 'hidden' ? 'no-hide-descendants' : 'auto'}
      >
        {render(false)}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: state === 'selected', disabled: false }}
    >
      {({ pressed }) => render(pressed)}
    </Pressable>
  );
}
