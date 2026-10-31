import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facCard, facText, radius, useTheme } from '@/core/theme';
import { Icon } from '@/core/ui';

export type AdultGateProps =
  | {
      /** Hidden gesture surface: two-finger 3-second hold in the top-left corner (220 x 220). */
      step: 'hold';
      /** Small caption under the circles, for example "Hold 3 s". */
      holdLabel: string;
      /** Called when the surface has been held for 3 seconds. */
      onHoldComplete: () => void;
      accessibilityLabel: string;
    }
  | {
      /** Simple adult check (560 x 352 card). Failing or cancelling returns silently (R11). */
      step: 'check';
      overline: string;
      title: string;
      instruction: string;
      holdHereLabel: string;
      orPinLabel: string;
      /** Quiet note, for example that a wrong answer returns to the grid silently. */
      footnote: string;
      /** How many of the 4 PIN dots are filled. */
      pinFilled: number;
      /** Fired for each of the two hold buttons so the owner can detect "both held". */
      onHoldChange: (index: 0 | 1, held: boolean) => void;
    };

/** Adult gate (Figma 5:732): adult-only, low salience, never shown to the child as a task. */
export function AdultGate(props: AdultGateProps) {
  const { colors } = useTheme();
  const fac = colors.fac;

  if (props.step === 'hold') {
    return (
      <Pressable
        onLongPress={props.onHoldComplete}
        delayLongPress={3000}
        accessibilityRole="button"
        accessibilityLabel={props.accessibilityLabel}
        style={styles.holdWrap}
      >
        <View style={[styles.bigCircle, { backgroundColor: colors.adult.dot }]} />
        <View
          style={[
            styles.finger,
            { left: 52, backgroundColor: colors.adult.chipBg, borderColor: colors.adult.dot },
          ]}
        />
        <View
          style={[
            styles.finger,
            { left: 112, backgroundColor: colors.adult.chipBg, borderColor: colors.adult.dot },
          ]}
        />
        <View style={[styles.holdChip, { backgroundColor: colors.adult.chipBg }]}>
          <Text style={[facText.captionStrong, { color: colors.adult.chipInk }]}>
            {props.holdLabel}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View
      accessibilityViewIsModal
      accessibilityLabel={props.title}
      style={[styles.card, { backgroundColor: fac.surface }, facCard]}
    >
      <Text style={[facText.overline, { color: fac.primary }]}>{props.overline}</Text>
      <Text style={[facText.title, { color: fac.ink }]}>{props.title}</Text>
      <Text style={[facText.body, styles.centered, { color: fac.inkMuted }]}>
        {props.instruction}
      </Text>
      <View style={styles.holdRow}>
        {([0, 1] as const).map((index) => (
          <Pressable
            key={index}
            onPressIn={() => props.onHoldChange(index, true)}
            onPressOut={() => props.onHoldChange(index, false)}
            accessibilityRole="button"
            accessibilityLabel={props.holdHereLabel}
            style={[
              styles.holdButton,
              { backgroundColor: fac.primarySoft, borderColor: fac.primary },
            ]}
          >
            <Icon name="hand" size={28} color={fac.primary} />
            <Text style={[facText.bodyStrong, { color: fac.primary }]}>{props.holdHereLabel}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.pinRow} accessible accessibilityLabel={props.orPinLabel}>
        <Text style={[facText.caption, { color: fac.inkMuted }]}>{props.orPinLabel}</Text>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            testID={`pin-dot-${i}`}
            style={[
              styles.pinDot,
              {
                borderColor: fac.inkMuted,
                backgroundColor: i < props.pinFilled ? fac.ink : 'transparent',
              },
            ]}
          />
        ))}
      </View>
      <Text style={[facText.caption, styles.centered, { color: fac.inkMuted }]}>
        {props.footnote}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  holdWrap: { width: 220, height: 220 },
  bigCircle: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  finger: {
    position: 'absolute',
    top: 70,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  holdChip: {
    position: 'absolute',
    left: 74,
    top: 150,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 560,
    borderRadius: radius.xl,
    padding: 32,
    gap: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { textAlign: 'center' },
  holdRow: { flexDirection: 'row', gap: 24, alignSelf: 'stretch', justifyContent: 'center' },
  holdButton: {
    width: 236,
    height: 88,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
});
