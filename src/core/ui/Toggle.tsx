import { Pressable, StyleSheet, View } from 'react-native';

import { size as sizes, useTheme } from '@/core/theme';

import { Icon } from './Icon';

export interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Locked = set by the study protocol; cannot be changed (Figma State=Locked). */
  locked?: boolean;
  accessibilityLabel: string;
}

/** Switch (Figma 5:1064). Touch area 60 x 48, track 52 x 32, knob 24. */
export function Toggle({ value, onValueChange, locked = false, accessibilityLabel }: ToggleProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  const trackStyle = locked
    ? { backgroundColor: fac.muted, borderWidth: 1, borderColor: fac.border }
    : { backgroundColor: value ? fac.primary : fac.inkMuted };
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={locked}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: locked }}
      style={styles.target}
    >
      <View style={[styles.track, trackStyle, { justifyContent: 'center' }]}>
        <View
          style={[
            styles.knob,
            {
              backgroundColor: fac.surface,
              alignSelf: value && !locked ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          {locked ? <Icon name="lock" size={14} color={fac.inkMuted} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { width: 60, height: sizes.targetFac, alignItems: 'center', justifyContent: 'center' },
  track: { width: 52, height: 32, borderRadius: 16, padding: 4 },
  knob: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
