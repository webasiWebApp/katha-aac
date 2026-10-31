import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';

import { Icon } from './Icon';

export type TextFieldState = 'default' | 'focus' | 'locked';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  /** Locked = set by the study protocol; read only with a lock icon. */
  locked?: boolean;
  /** Forces the visual state (used by the gallery); otherwise focus is tracked internally. */
  state?: TextFieldState;
}

/** Labelled text field (Figma 5:1140): 52 dp box, 1 px border; focus = 2 px primary border. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  locked = false,
  state,
}: TextFieldProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  const [focused, setFocused] = useState(false);
  const resolved: TextFieldState = state ?? (locked ? 'locked' : focused ? 'focus' : 'default');

  return (
    <View style={styles.wrap}>
      <Text style={[facText.captionStrong, { color: fac.inkMuted }]}>{label}</Text>
      <View
        style={[
          styles.box,
          {
            backgroundColor: resolved === 'locked' ? fac.muted : fac.surface,
            borderColor: resolved === 'focus' ? fac.primary : fac.border,
            borderWidth: resolved === 'focus' ? 2 : 1,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={fac.inkMuted}
          editable={resolved !== 'locked'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityState={{ disabled: resolved === 'locked' }}
          style={[facText.body, styles.input, { color: fac.ink }]}
        />
        {resolved === 'locked' ? <Icon name="lock" size={16} color={fac.inkMuted} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, padding: 0 },
});
