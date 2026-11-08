import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { childText, useTheme } from '@/core/theme';
import { cellFrameStyle, type CellFrameState } from '@/core/ui';
import { Pictogram, type PictogramName } from '@/features/vocabulary';

import { ClassTint } from './ClassTint';

export type CoreKeyKind = 'core' | 'nav';

export interface CoreKeyProps {
  /** core = purple edge (help, more, stop, yes, no). nav = neutral band + folder edge (Home, Quick, Break). */
  kind: CoreKeyKind;
  /** Forces the pressed look (gallery / tests); otherwise shown while the finger is down. */
  pressed?: boolean;
  /** Sinhala label. verify with SLT */
  label: string;
  pictogram: PictogramName;
  onPress: () => void;
  /** When set, the key fills the available width (used by CoreKeyRow). Default 143 x 88. */
  flex?: boolean;
  accessibilityLabel?: string;
  /** Key height in dp (default 88; phones use 64). */
  height?: number;
}

const RADIUS = 16;
const PAD = { l: 6, r: 6, t: 10, b: 4 };

/** Fixed core / navigation key (Figma 5:520), 143 x 88, same place on every page (R2). */
export function CoreKey({
  kind,
  pressed: forcedPressed = false,
  label,
  pictogram,
  onPress,
  flex = false,
  accessibilityLabel,
  height = 88,
}: CoreKeyProps) {
  const { colors } = useTheme();
  const compact = height < 80;
  // Box must be at least as tall as the line, or shrink-to-fit collapses the font.
  const labelBox = height >= 60 ? 34 : 26;

  const render = (down: boolean) => {
    const state: CellFrameState = forcedPressed || down ? 'pressed' : 'default';
    const frame = cellFrameStyle(colors, {
      state,
      radius: RADIUS,
      surface: kind === 'nav' ? colors.child.band : colors.child.surface,
    });
    const bw = frame.borderWidth ?? 2;
    const container: ViewStyle = {
      height,
      ...(flex ? { flex: 1 } : { width: 143 }),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      paddingLeft: Math.max(0, PAD.l - bw),
      paddingRight: Math.max(0, PAD.r - bw),
      paddingTop: Math.max(0, (compact ? 4 : PAD.t) - bw),
      paddingBottom: Math.max(0, (compact ? 2 : PAD.b) - bw),
      ...frame,
    };
    return (
      <View style={container}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: -bw, left: -bw, right: -bw }}
        >
          <ClassTint wordClass={kind === 'core' ? 'core' : 'folder'} testID="class-tint" />
        </View>
        <Pictogram symbol={pictogram} size={compact ? (height >= 60 ? 24 : 20) : 44} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[
            childText.labelS,
            { color: colors.child.ink },
            compact ? { height: labelBox, lineHeight: labelBox - 4, maxWidth: '100%', textAlign: 'center' } : null,
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={flex ? { flex: 1 } : undefined}
    >
      {({ pressed }) => render(pressed)}
    </Pressable>
  );
}
