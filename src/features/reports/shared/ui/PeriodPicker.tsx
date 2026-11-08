import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, radius, space, useTheme } from '@/core/theme';
import { Icon } from '@/core/ui';

export type PeriodPreset = 'today' | '7d' | '30d';

export interface PeriodPickerProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Period selector button (Figma 5:274). Tapping opens PeriodSheet. */
export function PeriodPicker({ label, onPress, accessibilityLabel }: PeriodPickerProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Period: ${label}`}
      style={[
        styles.picker,
        { backgroundColor: colors.fac.surface, borderColor: colors.fac.border },
      ]}
    >
      <Icon name="calendar" size={20} color={colors.fac.inkMuted} />
      <Text style={[facText.body, styles.label, { color: colors.fac.ink }]}>{label}</Text>
      <Icon name="chevron-down" size={20} color={colors.fac.inkMuted} />
    </Pressable>
  );
}

export interface PeriodSheetProps {
  selectedPreset: PeriodPreset | 'custom';
  onSelect: (preset: PeriodPreset | 'custom') => void;
  onClose: () => void;
}

const PRESETS: { key: PeriodPreset | 'custom'; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'custom', label: 'Custom' },
];

/** Bottom sheet for period selection. */
export function PeriodSheet({ selectedPreset, onSelect, onClose }: PeriodSheetProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.sheet, { backgroundColor: colors.fac.surface }]}
      accessibilityViewIsModal
      accessibilityLabel="Select period"
    >
      {PRESETS.map((p) => (
        <Pressable
          key={p.key}
          onPress={() => { onSelect(p.key); onClose(); }}
          accessibilityRole="radio"
          accessibilityLabel={p.label}
          accessibilityState={{ selected: selectedPreset === p.key }}
          style={styles.option}
        >
          <Text style={[facText.body, { color: colors.fac.ink }]}>{p.label}</Text>
          {selectedPreset === p.key && (
            <Icon name="check" size={20} color={colors.fac.primary} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.s16,
    gap: space.s8,
  },
  label: { flex: 1 },
  sheet: {
    borderRadius: radius.lg,
    padding: space.s16,
    gap: space.s4,
  },
  option: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.s8,
  },
});
