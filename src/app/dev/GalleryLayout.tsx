import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';

/** Scrolling page used by every gallery screen. Uses the active theme so modes can be compared. */
export function GalleryPage({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.fac.bg }}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** One component: its name, Figma node and a wrapping row of states. */
export function Showcase({
  title,
  node,
  note,
  wide = false,
  children,
}: {
  title: string;
  /** Figma node id, for example "4:167". */
  node: string;
  note?: string;
  /** Wide items (message bar, strips) scroll sideways instead of wrapping. */
  wide?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const items = <View style={styles.row}>{children}</View>;
  return (
    <View style={styles.showcase}>
      <Text style={[facText.heading, { color: colors.fac.ink }]}>
        {title}{' '}
        <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>· Figma {node}</Text>
      </Text>
      {note ? <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{note}</Text> : null}
      {wide ? (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          {items}
        </ScrollView>
      ) : (
        items
      )}
    </View>
  );
}

/** A state with a caption underneath. */
export function Labeled({ caption, children }: { caption: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.labeled}>
      {children}
      <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{caption}</Text>
    </View>
  );
}

/** Child components sit on the child background so their contrast matches the real screen. */
export function ChildStage({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.stage, { backgroundColor: colors.child.bg }]}>{children}</View>;
}

const styles = StyleSheet.create({
  page: { padding: 16, gap: 24, paddingBottom: 48 },
  showcase: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  labeled: { gap: 6, alignItems: 'flex-start' },
  stage: { padding: 12, borderRadius: 12, gap: 12, alignSelf: 'flex-start' },
});
