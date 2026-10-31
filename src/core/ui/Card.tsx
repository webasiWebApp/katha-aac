import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { facText, radius, useTheme } from '@/core/theme';

export interface CardProps {
  title?: string;
  body?: string;
  children?: ReactNode;
}

/** Plain content card (Figma 5:1178): 16 dp padding, 1 px border, radius 16. */
export function Card({ title, body, children }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}
    >
      {title ? <Text style={[facText.heading, { color: colors.fac.ink }]}>{title}</Text> : null}
      {body ? <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{body}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 8 },
});
