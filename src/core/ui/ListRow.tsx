import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';

import { Icon, type IconName } from './Icon';
import { Toggle } from './Toggle';

export type ListRowKind = 'navigation' | 'toggle' | 'value';

export interface ListRowProps {
  kind: ListRowKind;
  title: string;
  subtitle?: string;
  /** Leading icon in a 40 dp circle. */
  icon?: IconName;
  /** kind="value": the current value shown on the right. */
  value?: string;
  /** kind="toggle" */
  toggleValue?: boolean;
  onToggle?: (next: boolean) => void;
  toggleLocked?: boolean;
  /** kind="navigation" | "value" */
  onPress?: () => void;
}

/** Settings-style row (Figma 5:1122). Minimum height 64 dp. */
export function ListRow({
  kind,
  title,
  subtitle,
  icon,
  value,
  toggleValue = false,
  onToggle,
  toggleLocked,
  onPress,
}: ListRowProps) {
  const { colors } = useTheme();
  const fac = colors.fac;

  const content = (
    <>
      {icon ? (
        <View style={[styles.lead, { backgroundColor: fac.muted }]}>
          <Icon name={icon} size={20} color={fac.inkMuted} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[facText.bodyStrong, { color: fac.ink }]}>{title}</Text>
        {subtitle ? (
          <Text style={[facText.caption, { color: fac.inkMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      {kind === 'value' && value !== undefined ? (
        <Text style={[facText.body, { color: fac.inkMuted }]}>{value}</Text>
      ) : null}
      {kind === 'toggle' ? (
        <Toggle
          value={toggleValue}
          onValueChange={onToggle ?? (() => undefined)}
          locked={toggleLocked}
          accessibilityLabel={title}
        />
      ) : (
        <Icon name="chevron-right" size={20} color={fac.inkMuted} />
      )}
    </>
  );

  const rowStyle = [
    styles.row,
    { backgroundColor: fac.surface, minHeight: kind === 'toggle' ? 72 : 64 },
  ];

  if (kind === 'toggle') {
    return <View style={rowStyle}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value !== undefined ? `${title}, ${value}` : title}
      accessibilityHint={subtitle}
      style={rowStyle}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  lead: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
