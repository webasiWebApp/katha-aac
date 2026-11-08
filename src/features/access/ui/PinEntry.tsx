import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, space, useTheme } from '@/core/theme';
import { NumericKeypad } from '@/core/ui';

export interface PinEntryProps {
  /** Called with the 4 digits. The dots clear straight away (a wrong PIN never shows a reason). */
  onComplete: (pin: string) => void;
  disabled?: boolean;
  dotsLabel: string;
}

/** Four PIN dots plus the numeric keypad. */
export function PinEntry({ onComplete, disabled = false, dotsLabel }: PinEntryProps) {
  const { colors } = useTheme();
  const [digits, setDigits] = useState('');

  const onKey = (key: string) => {
    if (disabled) return;
    if (key === 'backspace') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    const next = (digits + key).slice(0, 4);
    if (next.length === 4) {
      setDigits('');
      onComplete(next);
    } else {
      setDigits(next);
    }
  };

  return (
    <View style={styles.wrap}>
      <View
        style={styles.dots}
        accessible
        accessibilityLabel={dotsLabel}
        accessibilityValue={{ text: `${digits.length}/4` }}
        testID="pin-dots"
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            testID={i < digits.length ? 'pin-dot-filled' : 'pin-dot-empty'}
            style={[
              styles.dot,
              {
                borderColor: colors.fac.primary,
                backgroundColor: i < digits.length ? colors.fac.primary : 'transparent',
              },
            ]}
          />
        ))}
      </View>
      <NumericKeypad onKey={onKey} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.s24 },
  dots: { flexDirection: 'row', gap: space.s16 },
  dot: { width: 20, height: 20, borderRadius: radius.xl, borderWidth: 2 },
});
