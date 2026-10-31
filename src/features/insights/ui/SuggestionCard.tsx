import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';
import { Button, Chip, Icon, type ChipTone, type IconName } from '@/core/ui';

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export interface SuggestionAction {
  label: string;
  onPress: () => void;
}

export interface SuggestionCardProps {
  /** For example "Vocabulary gap". */
  category: string;
  categoryIcon?: IconName;
  confidence: SuggestionConfidence;
  /** Text of the confidence chip, for example "High confidence". */
  confidenceLabel: string;
  /** Plain-language suggestion. */
  suggestion: string;
  /** Evidence line, for example "From 14 sessions, last 7 days". Every card has one. */
  evidence: string;
  /**
   * Held = a study phase is active, so layout changes wait (D-05). The primary action is dimmed
   * and `heldMessage` explains why. Nothing ever auto-applies.
   */
  held?: boolean;
  heldMessage?: string;
  primary: SuggestionAction;
  secondary: SuggestionAction;
  /** Two low-emphasis actions, for example dismiss and remind later. */
  tertiary: readonly [SuggestionAction, SuggestionAction];
}

const CONFIDENCE_TONE: Record<SuggestionConfidence, ChipTone> = {
  high: 'success',
  medium: 'primary',
  low: 'neutral',
};

/** Suggestion card (Figma 5:1512, 6 variants = 3 confidence x 2 states). */
export function SuggestionCard({
  category,
  categoryIcon = 'bulb',
  confidence,
  confidenceLabel,
  suggestion,
  evidence,
  held = false,
  heldMessage,
  primary,
  secondary,
  tertiary,
}: SuggestionCardProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  return (
    <View style={[styles.card, { backgroundColor: fac.surface, borderColor: fac.border }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: fac.primarySoft }]}>
          <Icon name={categoryIcon} size={20} color={fac.primary} />
        </View>
        <Text style={[facText.captionStrong, styles.category, { color: fac.inkMuted }]}>
          {category}
        </Text>
        <Chip label={confidenceLabel} tone={CONFIDENCE_TONE[confidence]} />
      </View>
      <Text style={[facText.bodyStrong, { color: fac.ink }]}>{suggestion}</Text>
      <View style={styles.evidence}>
        <Icon name="chart" size={16} color={fac.inkMuted} />
        <Text style={[facText.caption, { color: fac.inkMuted }]}>{evidence}</Text>
      </View>
      {held && heldMessage ? (
        <View
          style={[styles.held, { backgroundColor: fac.warningSoft }]}
          accessibilityLiveRegion="polite"
        >
          <Icon name="lock" size={16} color={fac.warning} />
          <Text style={[facText.captionStrong, styles.heldText, { color: fac.warning }]}>
            {heldMessage}
          </Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={styles.grow}>
          <Button
            label={primary.label}
            onPress={primary.onPress}
            variant="primary"
            disabled={held}
          />
        </View>
        <View style={styles.grow}>
          <Button label={secondary.label} onPress={secondary.onPress} variant="secondary" />
        </View>
      </View>
      <View style={styles.row}>
        {tertiary.map((action) => (
          <View key={action.label} style={styles.grow}>
            <Button label={action.label} onPress={action.onPress} variant="ghost" />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: { flex: 1 },
  evidence: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  held: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heldText: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
});
