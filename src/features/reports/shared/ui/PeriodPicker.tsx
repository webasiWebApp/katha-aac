import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { StringKey } from '@/core/i18n/en';
import { t } from '@/core/i18n/t';
import { facText, radius, space, useTheme } from '@/core/theme';
import { Button, Icon, TextField } from '@/core/ui';

import {
  validateCustomRange,
  type CustomRange,
  type CustomRangeError,
} from '../../domain/customPeriod';

export type PeriodPreset = 'today' | '7d' | '30d';

export interface PeriodPickerProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Period selector button (Figma 5:274). Tapping opens PeriodSheet. */
export function PeriodPicker({ label, onPress, accessibilityLabel }: PeriodPickerProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `Period: ${label}`}
      style={[
        styles.picker,
        { backgroundColor: colors.fac.surface, borderColor: colors.fac.border },
      ]}
    >
      <Icon name="calendar" size={20} color={colors.fac.inkMuted} />
      <Text style={[facText.body, styles.label, { color: colors.fac.ink }]}>{label}</Text>
      <Icon name="chevron-down" size={20} color={colors.fac.inkMuted} />
    </Pressable>
  );
}

export interface PeriodSheetProps {
  selectedPreset: PeriodPreset | 'custom';
  onSelect: (preset: PeriodPreset | 'custom') => void;
  onClose: () => void;
  /** Current custom range. With onApplyCustom, "Custom" opens two date fields. */
  customRange?: CustomRange;
  onApplyCustom?: (range: CustomRange) => void;
  /** Local date used to validate the range (defaults to the device date). */
  today?: string;
}

const PRESETS: { key: PeriodPreset | 'custom'; label: StringKey }[] = [
  { key: 'today', label: 'dashboard.today' },
  { key: '7d', label: 'dashboard.last_7d' },
  { key: '30d', label: 'dashboard.last_30d' },
  { key: 'custom', label: 'period.custom' },
];

const ERROR_KEY: Record<CustomRangeError, StringKey> = {
  format: 'period.error.format',
  order: 'period.error.order',
  future: 'period.error.future',
  too_long: 'period.error.too_long',
};

function deviceToday(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Bottom sheet for period selection: Today, Last 7 days, Last 30 days, Custom (two date fields). */
export function PeriodSheet({
  selectedPreset,
  onSelect,
  onClose,
  customRange,
  onApplyCustom,
  today,
}: PeriodSheetProps) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState(customRange?.from ?? '');
  const [to, setTo] = useState(customRange?.to ?? '');
  const [error, setError] = useState<CustomRangeError | null>(null);

  const choose = (key: PeriodPreset | 'custom') => {
    if (key === 'custom' && onApplyCustom) {
      setEditing(true);
      return;
    }
    onSelect(key);
    onClose();
  };

  const apply = () => {
    const range = { from: from.trim(), to: to.trim() };
    const checked = validateCustomRange(range, today ?? deviceToday());
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    onApplyCustom?.(range);
    onClose();
  };

  return (
    <View
      style={[styles.sheet, { backgroundColor: colors.fac.surface }]}
      accessibilityViewIsModal
      accessibilityLabel={t('period.select')}
    >
      {PRESETS.map((p) => (
        <Pressable
          key={p.key}
          onPress={() => choose(p.key)}
          accessibilityRole="radio"
          accessibilityLabel={t(p.label)}
          accessibilityState={{ selected: selectedPreset === p.key }}
          style={styles.option}
        >
          <Text style={[facText.body, { color: colors.fac.ink }]}>{t(p.label)}</Text>
          {selectedPreset === p.key && <Icon name="check" size={20} color={colors.fac.primary} />}
        </Pressable>
      ))}
      {editing ? (
        <View style={styles.custom} testID="period-custom-form">
          <TextField
            label={t('period.from')}
            value={from}
            onChangeText={setFrom}
            placeholder="YYYY-MM-DD"
          />
          <TextField
            label={t('period.to')}
            value={to}
            onChangeText={setTo}
            placeholder="YYYY-MM-DD"
          />
          {error ? (
            <Text style={[facText.caption, { color: colors.fac.danger }]} accessibilityRole="alert">
              {t(ERROR_KEY[error])}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setEditing(false)} />
            <Button label={t('period.apply')} onPress={apply} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.s16,
    gap: space.s8,
  },
  label: { flex: 1 },
  sheet: {
    borderRadius: radius.lg,
    padding: space.s16,
    gap: space.s4,
  },
  custom: { gap: space.s12, paddingTop: space.s8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.s8 },
  option: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.s8,
  },
});
