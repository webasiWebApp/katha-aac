import { StyleSheet, Text, View } from 'react-native';

import { facText, fontFamily, useTheme, type ColorTokens } from '@/core/theme';

/** 1 (lightest) to 5 (darkest) maps to chart/heat-1..5. null = no data (dashed, fac/muted). */
export type HeatLevel = 1 | 2 | 3 | 4 | 5 | null;

export interface GridHeatCell {
  /** Symbol label (Sinhala, verify with SLT). */
  label: string;
  /** Median seconds, for example "1.8 s". */
  valueLabel: string;
  level: HeatLevel;
}

export interface RoutineHeatRow {
  label: string;
  levels: readonly HeatLevel[];
}

export type HeatmapProps =
  | {
      kind: 'grid';
      /** Rows of 4 cells (78 x 48). */
      rows: readonly (readonly (GridHeatCell | null)[])[];
      accessibilityLabel: string;
    }
  | {
      kind: 'routine';
      /** Hour captions across the top, for example ["06", "08", ...]. */
      hours: readonly string[];
      rows: readonly RoutineHeatRow[];
      accessibilityLabel: string;
    };

function heatColor(colors: ColorTokens, level: Exclude<HeatLevel, null>): string {
  return [
    colors.chart.heat1,
    colors.chart.heat2,
    colors.chart.heat3,
    colors.chart.heat4,
    colors.chart.heat5,
  ][level - 1] as string;
}

/** Single-hue (blue) lightness heatmap (Figma 7:801). Sample data only. */
export function Heatmap(props: HeatmapProps) {
  const { colors } = useTheme();
  const fac = colors.fac;

  if (props.kind === 'grid') {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={props.accessibilityLabel}
        style={styles.gridWrap}
      >
        {props.rows.map((row, r) => (
          <View key={r} style={styles.gridRow}>
            {row.map((cell, c) => {
              if (!cell || cell.level === null) {
                return (
                  <View
                    key={c}
                    style={[
                      styles.gridCell,
                      styles.empty,
                      { backgroundColor: fac.muted, borderColor: fac.border },
                    ]}
                  />
                );
              }
              const ink = cell.level >= 4 ? fac.onPrimary : fac.ink;
              return (
                <View
                  key={c}
                  style={[styles.gridCell, { backgroundColor: heatColor(colors, cell.level) }]}
                >
                  <Text style={[facText.caption, styles.medium, { color: ink }]}>{cell.label}</Text>
                  <Text style={[facText.captionStrong, { color: ink }]}>{cell.valueLabel}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={props.accessibilityLabel}
      style={styles.routineWrap}
    >
      <View style={styles.routineRow}>
        <View style={styles.rowLabel} />
        {props.hours.map((hour) => (
          <Text key={hour} style={[facText.caption, styles.hour, { color: fac.inkMuted }]}>
            {hour}
          </Text>
        ))}
      </View>
      {props.rows.map((row) => (
        <View key={row.label} style={styles.routineRow}>
          <Text style={[facText.caption, styles.rowLabel, { color: fac.inkMuted }]}>
            {row.label}
          </Text>
          {row.levels.map((level, i) => (
            <View
              key={i}
              style={[
                styles.routineCell,
                { backgroundColor: level === null ? fac.muted : heatColor(colors, level) },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrap: { gap: 4, alignSelf: 'flex-start' },
  gridRow: { flexDirection: 'row', gap: 4 },
  gridCell: {
    width: 78,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { borderWidth: 1, borderStyle: 'dashed' },
  medium: { fontFamily: fontFamily.sinhalaMedium },
  routineWrap: { gap: 3, alignSelf: 'flex-start' },
  routineRow: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  rowLabel: { width: 68 },
  hour: { width: 28, textAlign: 'center' },
  routineCell: { width: 28, height: 22, borderRadius: 4 },
});
