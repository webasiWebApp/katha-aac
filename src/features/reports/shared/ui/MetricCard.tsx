import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, space, useTheme } from '@/core/theme';
import { Icon } from '@/core/ui';

import type { MeasureResult } from '../types';

export interface MetricCardProps {
  result: MeasureResult;
  label: string;
  /** Optional note shown below the value. */
  note?: string;
}

const MIN_SESSIONS = 5;

/**
 * Single metric card (Figma 5:268).
 * Count: label + integer value + note.
 * Rate: label + "N%" value + "N of D opportunities" note.
 * Locked: label + lock icon + "Shown after 5 sessions (N so far)".
 */
export function MetricCard({ result, label, note }: MetricCardProps) {
  const { colors } = useTheme();

  let valueNode: React.ReactNode;
  let noteText: string | undefined = note;

  if (result.locked) {
    const lockedNote = `Shown after ${MIN_SESSIONS} sessions (${result.sessionsSoFar} so far)`;
    return (
      <View style={[styles.card, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}>
        <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{label}</Text>
        <View style={styles.lockedRow}>
          <Icon name="lock" size={18} color={colors.fac.inkMuted} />
          <Text style={[facText.caption, styles.noteText, { color: colors.fac.inkMuted }]}>
            {lockedNote}
          </Text>
        </View>
      </View>
    );
  }

  if (result.numerator !== undefined && result.denominator !== undefined && result.denominator > 0) {
    const pct = Math.round((result.numerator / result.denominator) * 100);
    valueNode = <Text style={[facText.stat, { color: colors.fac.ink }]}>{pct}%</Text>;
    noteText = note ?? `${result.numerator} of ${result.denominator} opportunities`;
  } else {
    const display = result.value !== null ? String(result.value) : '—';
    valueNode = <Text style={[facText.stat, { color: colors.fac.ink }]}>{display}</Text>;
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}>
      <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{label}</Text>
      {valueNode}
      {noteText ? (
        <Text style={[facText.caption, styles.noteText, { color: colors.fac.inkMuted }]}>
          {noteText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.s12,
    gap: space.s4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.s8 },
  noteText: { flexShrink: 1 },
});
