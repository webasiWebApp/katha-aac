import { Pressable, StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';

import { Icon, type IconName } from './Icon';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
}

export interface BottomNavProps {
  items: readonly BottomNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

/** Bottom tab bar (Figma 5:1021): 72 dp, active tab has a 56 x 30 primary-soft pill. */
export function BottomNav({ items, activeKey, onSelect }: BottomNavProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: fac.surface, borderTopColor: fac.border }]}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            style={styles.item}
          >
            <View style={[styles.pill, active && { backgroundColor: fac.primarySoft }]}>
              <Icon name={item.icon} size={22} color={active ? fac.primary : fac.inkMuted} />
            </View>
            <Text
              style={[
                active ? facText.captionStrong : facText.caption,
                { color: active ? fac.primary : fac.inkMuted },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 72,
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  item: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
