import { StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';
import { Toggle } from '@/core/ui';

export interface SectionHeaderReportProps {
  kind: 'report';
  title: string;
  subtitle?: string;
}

export interface SectionHeaderBuilderProps {
  kind: 'builder';
  title: string;
  toggleValue: boolean;
  onToggle: (next: boolean) => void;
  toggleLabel: string;
}

export type SectionHeaderProps = SectionHeaderReportProps | SectionHeaderBuilderProps;

/** Report or builder section header (Figma 5:291). */
export function SectionHeader(props: SectionHeaderProps) {
  const { colors } = useTheme();

  if (props.kind === 'builder') {
    return (
      <View style={styles.row}>
        <Text style={[facText.heading, styles.title, { color: colors.fac.ink }]}>{props.title}</Text>
        <Toggle
          value={props.toggleValue}
          onValueChange={props.onToggle}
          accessibilityLabel={props.toggleLabel}
        />
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <Text style={[facText.heading, { color: colors.fac.ink }]}>{props.title}</Text>
      {props.subtitle ? (
        <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{props.subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stack: { gap: 2 },
  title: { flex: 1 },
});
