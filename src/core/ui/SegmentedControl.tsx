import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facCard, facText, useTheme } from '@/core/theme';

export interface SegmentOption {
  key: string;
  label: string;
}

export interface SegmentedControlProps {
  options: readonly SegmentOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  accessibilityLabel: string;
}

/**
 * Segmented control (Figma 5:1086): 48 dp track, 40 dp segments, selected segment is a raised
 * surface (Fac/Card). hitSlop of 4 dp above and below makes each segment a 48 dp touch target.
 */
export function SegmentedControl({
  options,
  selectedKey,
  onSelect,
  accessibilityLabel,
}: SegmentedControlProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  return (
    <View
      style={[styles.track, { backgroundColor: fac.muted }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            hitSlop={{ top: 4, bottom: 4 }}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
            style={[styles.segment, selected && [{ backgroundColor: fac.surface }, facCard]]}
          >
            <Text
              style={[
                selected ? facText.captionStrong : facText.caption,
                { color: selected ? fac.ink : fac.inkMuted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 48, borderRadius: 12, padding: 4, flexDirection: 'row', gap: 4 },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
