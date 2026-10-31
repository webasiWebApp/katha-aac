import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { childText, useTheme } from '@/core/theme';
import { cellFrameStyle } from '@/core/ui';
import { ClassTint, type WordClass } from '@/features/board';
import { Pictogram, type PictogramName } from '@/features/vocabulary';

export type StripCellState = 'default' | 'linked';

export interface StripCellProps {
  /** Linked = this strip cell and its matching grid cell both glow (C-04). */
  state?: StripCellState;
  /** Copies the grid cell's label, pictogram and edge exactly. verify with SLT */
  label: string;
  pictogram: PictogramName;
  wordClass: WordClass;
  onPress: () => void;
  accessibilityLabel?: string;
}

const RADIUS = 14;
const PAD = { l: 12, r: 16, t: 10, b: 8 };

/** Prediction strip cell (Figma 4:183), 216 x 72. */
export function StripCell({
  state = 'default',
  label,
  pictogram,
  wordClass,
  onPress,
  accessibilityLabel,
}: StripCellProps) {
  const { colors } = useTheme();

  const render = (down: boolean) => {
    const frame = cellFrameStyle(colors, {
      state: state === 'linked' ? 'selected' : down ? 'pressed' : 'default',
      radius: RADIUS,
    });
    const bw = frame.borderWidth ?? 2;
    const container: ViewStyle = {
      width: 216,
      height: 72,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      overflow: 'hidden',
      paddingLeft: Math.max(0, PAD.l - bw),
      paddingRight: Math.max(0, PAD.r - bw),
      paddingTop: Math.max(0, PAD.t - bw),
      paddingBottom: Math.max(0, PAD.b - bw),
      ...frame,
    };
    return (
      <View style={container}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: -bw, left: -bw, right: -bw }}
        >
          <ClassTint wordClass={wordClass} testID="class-tint" />
        </View>
        <Pictogram symbol={pictogram} size={48} />
        <Text style={[childText.strip, { color: colors.child.ink }]}>{label}</Text>
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: state === 'linked' }}
    >
      {({ pressed }) => render(pressed)}
    </Pressable>
  );
}
