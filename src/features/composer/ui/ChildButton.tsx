import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { childText, useTheme } from '@/core/theme';
import { cellFrameStyle, type CellFrameState } from '@/core/ui';
import { Pictogram, type PictogramName } from '@/features/vocabulary';

export type ChildButtonKind = 'speak' | 'replay' | 'undo' | 'clear';
export type ChildButtonState = 'default' | 'pressed' | 'disabled' | 'longPress';

export interface ChildButtonProps {
  kind: ChildButtonKind;
  /** Forces a state (gallery / tests). Otherwise "pressed" is shown while the finger is down. */
  state?: ChildButtonState;
  /** Sinhala word shown on Speak only. verify with SLT */
  label?: string;
  /** Required: Undo and Clear have no visible text. */
  accessibilityLabel: string;
  /** Clear only: how to use it, for example "Hold to clear". */
  accessibilityHint?: string;
  /** Speak and Undo: tap. */
  onPress?: () => void;
  /** Clear: long-press only, so a stray tap cannot wipe the message. */
  onLongPress?: () => void;
}

const PICTOGRAM: Record<ChildButtonKind, PictogramName> = {
  speak: 'speak',
  // Placeholder art drawn in-house (assets/pictograms/replay.svg) until the designer delivers it (H-05).
  replay: 'replay',
  undo: 'undo',
  clear: 'clear',
};

/**
 * Speak / Undo / Clear (Figma 5:486). Fixed position on every child screen.
 * Speak is 136 x 96 with a soft blue fill; Undo and Clear are 96 x 96. Clear ignores plain taps.
 */
export function ChildButton({
  kind,
  state,
  label,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  onLongPress,
}: ChildButtonProps) {
  const { colors } = useTheme();
  const disabled = state === 'disabled';
  const isSpeak = kind === 'speak';
  const radiusPx = 20;

  const render = (down: boolean) => {
    const resolved: ChildButtonState = state ?? (down ? 'pressed' : 'default');
    const frameState: CellFrameState = resolved === 'pressed' ? 'pressed' : 'default';
    let frame: ViewStyle = cellFrameStyle(colors, { state: frameState, radius: radiusPx });
    if (isSpeak && resolved !== 'disabled') {
      // Speak keeps its soft blue fill and a 2 px blue border by default; pressed adds the 4 px glow.
      frame =
        resolved === 'pressed'
          ? { ...frame, backgroundColor: colors.child.selectedSoft }
          : {
              ...frame,
              backgroundColor: colors.child.selectedSoft,
              borderColor: colors.child.selected,
            };
    }
    const dim = resolved === 'disabled' ? 0.35 : 1;
    return (
      <View
        style={{
          width: isSpeak ? 136 : 96,
          height: 96,
          alignItems: 'center',
          justifyContent: 'center',
          ...frame,
        }}
      >
        <View style={{ opacity: dim }}>
          <Pictogram symbol={PICTOGRAM[kind]} size={isSpeak ? 52 : 56} />
        </View>
        {isSpeak && label ? (
          <Text style={[childText.chip, { color: colors.child.ink, opacity: dim }]}>{label}</Text>
        ) : null}
        {resolved === 'longPress' ? (
          // Progress ring while the long-press is held. Ring styling is approximated: the Figma
          // ellipse (84 x 84, child/selected) was not inspected beyond its fill.
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 84,
              height: 84,
              borderRadius: 42,
              borderWidth: 4,
              borderColor: colors.child.selected,
            }}
          />
        ) : null}
      </View>
    );
  };

  return (
    <Pressable
      onPress={kind === 'clear' ? undefined : onPress}
      onLongPress={kind === 'clear' ? onLongPress : undefined}
      delayLongPress={800}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {({ pressed }) => render(pressed)}
    </Pressable>
  );
}
