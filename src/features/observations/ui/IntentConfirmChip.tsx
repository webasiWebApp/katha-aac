import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, size, useTheme } from '@/core/theme';
import { Icon, type IconName } from '@/core/ui';

export type IntentConfirmState = 'visible' | 'dismissing';

export interface IntentConfirmChipProps {
  state?: IntentConfirmState;
  /** For example "Meant this?" */
  question: string;
  meantLabel: string;
  notMeantLabel: string;
  unsureLabel: string;
  onMeant: () => void;
  onNotMeant: () => void;
  onUnsure: () => void;
}

/**
 * Adult-facing, low-salience grey chip shown after a spoken message (Figma 5:762):
 * check = meant, x = not meant, ? = unsure. Auto-dismisses after 6 s (timer lives in the owner).
 * The three answer buttons are 48 x 48.
 */
export function IntentConfirmChip({
  state = 'visible',
  question,
  meantLabel,
  notMeantLabel,
  unsureLabel,
  onMeant,
  onNotMeant,
  onUnsure,
}: IntentConfirmChipProps) {
  const { colors } = useTheme();
  const answers: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'check', label: meantLabel, onPress: onMeant },
    { icon: 'x', label: notMeantLabel, onPress: onNotMeant },
    { icon: 'question', label: unsureLabel, onPress: onUnsure },
  ];
  return (
    <View
      accessibilityLabel={question}
      style={[
        styles.chip,
        { backgroundColor: colors.adult.chipBg, opacity: state === 'dismissing' ? 0.45 : 1 },
      ]}
    >
      <Text style={[facText.captionStrong, { color: colors.adult.chipInk }]}>{question}</Text>
      {answers.map((answer) => (
        <Pressable
          key={answer.icon}
          onPress={answer.onPress}
          accessibilityRole="button"
          accessibilityLabel={answer.label}
          style={[styles.answer, { backgroundColor: colors.fac.surface }]}
        >
          <Icon name={answer.icon} size={20} color={colors.adult.chipInk} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 56,
    borderRadius: 28,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  answer: {
    width: size.targetFac,
    height: size.targetFac,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
