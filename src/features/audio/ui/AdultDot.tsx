import { View, type ViewStyle } from 'react-native';

import { useTheme } from '@/core/theme';

export interface AdultDotProps {
  /** For example "TTS voice used". Adult-only and low salience: hidden from the child. */
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/**
 * Tiny adult-only marker (Figma 5:763), 10 dp, adult/dot. Shown when synthetic speech (TTS)
 * replaced a recording. No error is shown to the child.
 */
export function AdultDot({ accessibilityLabel, style }: AdultDotProps) {
  const { colors } = useTheme();
  const labelled = accessibilityLabel !== undefined;
  return (
    <View
      accessible={labelled}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
      style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.adult.dot }, style]}
    />
  );
}
