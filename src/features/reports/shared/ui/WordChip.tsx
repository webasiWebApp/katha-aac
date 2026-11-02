import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, space, useTheme } from '@/core/theme';

export interface WordChipProps {
  word: string;
  count: number;
}

/** Vocabulary word chip with use count (Figma 7:404). */
export function WordChip({ word, count }: WordChipProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}
      accessible
      accessibilityLabel={`${word}, used ${count} times`}
    >
      <Text style={[facText.sinhalaStrong, { color: colors.fac.ink }]}>{word}</Text>
      <Text style={[facText.captionStrong, { color: colors.fac.inkMuted }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: space.s4,
    paddingHorizontal: space.s12,
    gap: space.s8,
    alignSelf: 'flex-start',
  },
});
