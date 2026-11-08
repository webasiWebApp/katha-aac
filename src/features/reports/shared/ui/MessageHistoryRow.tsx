import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/core/i18n/t';
import { facText, space, useTheme } from '@/core/theme';
import { Chip } from '@/core/ui';

import type { IntentAnswer, MessageHistoryEntry } from '../types';

export interface MessageHistoryRowProps {
  entry: MessageHistoryEntry;
  /** Short date-time string already formatted by the caller (e.g. "Tue 20 Oct · 07:12"). */
  timeLabel: string;
}

const ANSWER_CHIP: Record<
  NonNullable<IntentAnswer>,
  { tone: 'success' | 'warning' | 'neutral'; label: string }
> = {
  meant:     { tone: 'success', label: 'Meant' },
  not_meant: { tone: 'warning', label: 'Not meant' },
  unsure:    { tone: 'neutral', label: 'Unsure' },
};

/** One row in the message history list (Figma 7:407). */
export function MessageHistoryRow({ entry, timeLabel }: MessageHistoryRowProps) {
  const { colors } = useTheme();
  const answerConfig = entry.answer ? ANSWER_CHIP[entry.answer] : null;
  const source =
    entry.source === 'independent'
      ? t('history.source_independent')
      : entry.source === 'prompted'
        ? t('history.source_prompted')
        : t('history.source_not_tagged');
  const count = t(entry.symbolCount === 1 ? 'history.symbol_one' : 'history.symbol_other', { n: entry.symbolCount });
  const meta = `${timeLabel} · ${count} · ${source}`;

  return (
    <View
      style={[styles.row, { borderBottomColor: colors.fac.border }]}
      accessible
      accessibilityLabel={`${entry.sentence}, ${meta}`}
    >
      <View style={styles.top}>
        <Text style={[facText.sinhalaStrong, styles.sentence, { color: colors.fac.ink }]}>
          {entry.sentence}
        </Text>
        {answerConfig ? (
          <Chip label={answerConfig.label} tone={answerConfig.tone} />
        ) : (
          <Chip label="Not answered" tone="neutral" />
        )}
      </View>
      <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: space.s12,
    borderBottomWidth: 1,
    gap: space.s4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.s8,
  },
  sentence: { flex: 1 },
});
