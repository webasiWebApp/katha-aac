import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';

import { Icon } from './Icon';

export interface NumericKeypadProps {
  /** Called with the digit string '0'–'9' or 'backspace' when a key is pressed. */
  onKey: (key: string) => void;
  /** Dims and disables the entire keypad (e.g. while verifying a PIN). */
  disabled?: boolean;
}

// Row 0: 1 2 3 | Row 1: 4 5 6 | Row 2: 7 8 9 | Row 3: (empty) 0 (backspace)
const ROWS: readonly (readonly string[])[] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'backspace'],
] as const;

/** 3×4 numeric keypad for PIN entry (Figma T-025). Keys are 72×56 dp, Fac/Title digits. */
export function NumericKeypad({ onKey, disabled = false }: NumericKeypadProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.keypad, disabled && styles.disabled]}
      accessibilityLabel="PIN keypad"
      testID="numeric-keypad"
    >
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ci) =>
            key === '' ? (
              <View key={`empty-${ci}`} style={styles.key} />
            ) : (
              <Pressable
                key={key}
                onPress={disabled ? undefined : () => { onKey(key); }}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={key === 'backspace' ? 'Delete' : key}
                accessibilityState={{ disabled }}
                style={[
                  styles.key,
                  styles.pressable,
                  { backgroundColor: colors.fac.surface, borderColor: colors.fac.border },
                ]}
              >
                {key === 'backspace' ? (
                  <Icon name="undo" size={20} color={colors.fac.ink} />
                ) : (
                  <Text style={[facText.title, { color: colors.fac.ink }]}>{key}</Text>
                )}
              </Pressable>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  key: { width: 72, height: 56 },
  pressable: {
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
});
