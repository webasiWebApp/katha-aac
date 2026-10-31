import { Pressable, Text, View } from 'react-native';

import { childText, useTheme } from '@/core/theme';
import { Pictogram, type PictogramName } from '@/features/vocabulary';

export type TemplateSlotState = 'empty' | 'filled' | 'invalid';

export interface TemplateSlotProps {
  state: TemplateSlotState;
  /** Faint hint picture (empty / invalid) or the chosen symbol (filled). */
  pictogram: PictogramName;
  /** Shown only when filled. verify with SLT */
  label?: string;
  /** Spoken description of the empty slot, e.g. for a screen reader (never shown as text). */
  accessibilityLabel: string;
  onPress?: () => void;
}

/**
 * Open slot in a Sinhala sentence template such as "මට ___ ඕනේ" (Figma 5:124), 96 x 84.
 * Empty = faint symbol hint, never a text instruction. Invalid = wrong word class, shown calmly
 * with a slightly stronger hint (no red).
 */
export function TemplateSlot({
  state,
  pictogram,
  label,
  accessibilityLabel,
  onPress,
}: TemplateSlotProps) {
  const { colors } = useTheme();
  const filled = state === 'filled';
  const body = (
    <View
      style={{
        width: 96,
        height: 84,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 6,
        paddingRight: 6,
        paddingTop: 4,
        paddingBottom: 2,
        borderWidth: 2,
        ...(filled
          ? { backgroundColor: colors.child.selectedSoft, borderColor: colors.child.selected }
          : {
              backgroundColor: colors.child.placeholder,
              borderColor: colors.child.inkFaint,
              borderStyle: 'dashed' as const,
            }),
      }}
    >
      <View style={{ opacity: filled ? 1 : state === 'invalid' ? 0.4 : 0.25 }}>
        <Pictogram symbol={pictogram} size={filled ? 48 : 40} />
      </View>
      {filled && label ? (
        <Text style={[childText.chip, { color: colors.child.ink }]}>{label}</Text>
      ) : null}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={filled && label ? label : accessibilityLabel}
      accessibilityState={{ selected: filled }}
    >
      {body}
    </Pressable>
  );
}
