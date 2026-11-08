import { Text, View } from 'react-native';

import { childText, useTheme } from '@/core/theme';
import { Pictogram, type PictogramName } from '@/features/vocabulary';

export type MessageChipState = 'default' | 'speaking';

export interface MessageChipProps {
  state?: MessageChipState;
  pictogram: PictogramName;
  /** Written Sinhala word shown with the symbol (R7). verify with SLT */
  label: string;
  /** Phone: chip height in dp (default 84, 88 when speaking). */
  height?: number;
}

/**
 * Symbol plus written word inside the message bar (Figma 5:105). Speaking = the word being
 * spoken right now (soft blue fill, 2 px blue border). Display only.
 */
export function MessageChip({ state = 'default', pictogram, label, height }: MessageChipProps) {
  const { colors } = useTheme();
  const speaking = state === 'speaking';
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityState={{ selected: speaking }}
      style={{
        width: height ? Math.round(height * 0.95) : speaking ? 72 : 68,
        height: height ?? (speaking ? 88 : 84),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 4,
        paddingBottom: 2,
        ...(speaking
          ? {
              backgroundColor: colors.child.selectedSoft,
              borderWidth: 2,
              borderColor: colors.child.selected,
            }
          : {}),
      }}
    >
      <Pictogram symbol={pictogram} size={height ? Math.round(height * 0.4) : 48} />
      <Text
        numberOfLines={height ? 1 : undefined}
        adjustsFontSizeToFit={height !== undefined}
        minimumFontScale={0.5}
        style={[childText.chip, { color: colors.child.ink }, height ? { height: Math.round(height * 0.45), lineHeight: Math.round(height * 0.45) - 2, maxWidth: '100%' } : null]}
      >
        {label}
      </Text>
    </View>
  );
}
