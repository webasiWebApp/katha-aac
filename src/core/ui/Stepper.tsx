import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, radius, space, useTheme } from '@/core/theme';

export interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}

/** Number stepper with 48 x 48 buttons. */
export function Stepper({ label, value, min = 0, max = 999, onChange }: StepperProps) {
  const { colors } = useTheme();
  const btn = (sign: '-' | '+') => {
    const next = value + (sign === '+' ? 1 : -1);
    const disabled = next < min || next > max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${sign === '+' ? 'increase' : 'decrease'}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(next)}
        style={[styles.btn, { backgroundColor: colors.fac.muted, opacity: disabled ? 0.45 : 1 }]}
      >
        <Text style={[facText.title, { color: colors.fac.ink }]}>{sign === '+' ? '+' : '−'}</Text>
      </Pressable>
    );
  };
  return (
    <View style={styles.row} accessible={false}>
      <Text style={[facText.body, styles.label, { color: colors.fac.ink }]}>{label}</Text>
      {btn('-')}
      <Text
        style={[facText.title, styles.value, { color: colors.fac.ink }]}
        accessibilityLabel={`${label}: ${value}`}
        testID={`stepper-${label}`}
      >
        {value}
      </Text>
      {btn('+')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.s8 },
  label: { flex: 1 },
  btn: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  value: { minWidth: 36, textAlign: 'center' },
});
