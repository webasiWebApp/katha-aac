import { StyleSheet, Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';
import { Icon } from '@/core/ui';

export interface Phase {
  key: string;
  label: string;
}

export interface PhaseTimelineProps {
  /**
   * Study phases in order. Figma shows four: Baseline (silent training, fixed layout), Alternating
   * A/B/C, Probes, Maintenance. Phase names are supplied by the caller.
   */
  phases: readonly Phase[];
  currentKey: string;
  /** Spoken prefix for each step, for example "Current phase" / "Completed" / "Upcoming". */
  statusLabels: { done: string; current: string; upcoming: string };
}

/** Study phase timeline (Figma 5:1282): done = green check, current = blue number, next = outline. */
export function PhaseTimeline({ phases, currentKey, statusLabels }: PhaseTimelineProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  const currentIndex = Math.max(
    0,
    phases.findIndex((p) => p.key === currentKey),
  );

  return (
    <View accessibilityRole="list" style={styles.row}>
      {phases.map((phase, i) => {
        const status = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
        const circle =
          status === 'done'
            ? { backgroundColor: fac.success }
            : status === 'current'
              ? { backgroundColor: fac.primary }
              : { backgroundColor: fac.surface, borderWidth: 2, borderColor: fac.border };
        return (
          <View key={phase.key} style={styles.stepAndLink}>
            <View
              accessible
              accessibilityLabel={`${statusLabels[status]}: ${phase.label}`}
              accessibilityState={{ selected: status === 'current' }}
              style={styles.step}
            >
              <View style={[styles.circle, circle]}>
                {status === 'done' ? (
                  <Icon name="check" size={16} color={fac.onPrimary} />
                ) : (
                  <Text
                    style={[
                      facText.captionStrong,
                      { color: status === 'current' ? fac.onPrimary : fac.inkMuted },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  status === 'current' ? facText.captionStrong : facText.caption,
                  { color: status === 'current' ? fac.primary : fac.inkMuted },
                ]}
              >
                {phase.label}
              </Text>
            </View>
            {i < phases.length - 1 ? (
              <View style={styles.link}>
                <View
                  style={{
                    height: 2,
                    backgroundColor: status === 'done' ? fac.success : fac.border,
                  }}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch' },
  stepAndLink: { flexDirection: 'row', alignItems: 'flex-start', flexShrink: 1 },
  step: { alignItems: 'center', gap: 6, minWidth: 54 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { flex: 1, minWidth: 5, paddingTop: 13 },
});
