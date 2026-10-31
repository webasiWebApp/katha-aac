import { Text, View } from 'react-native';

import { facText, useTheme } from '@/core/theme';

export interface Bar {
  key: string;
  /** Category label under the bar (for example "Mon" or "A"). */
  label: string;
  value: number;
  /** Text printed above the bar. */
  valueLabel: string;
  /** Bar colour token; defaults to fac/primary (single accent). */
  color?: string;
}

export interface BarChartProps {
  width: number;
  height: number;
  bars: readonly Bar[];
  /** 28 for the week chart, 56 for the grouped conditions chart (Figma 7:690). */
  barWidth?: number;
  accessibilityLabel: string;
}

// Geometry read from Figma 7:690 (328 x 180): baseline at height - 24, value label 18 dp above bar.
const LABEL_HEIGHT = 18;
const BOTTOM = 24;
const TOP = 21;

/** Bar chart with value labels on bars and no legend (Figma 7:690). Sample data only. */
export function BarChart({
  width,
  height,
  bars,
  barWidth = 28,
  accessibilityLabel,
}: BarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(...bars.map((b) => b.value), 1);
  const baseY = height - BOTTOM;
  const maxBar = baseY - TOP - LABEL_HEIGHT;
  const padX = bars.length > 4 ? 8 : 20;
  const slot = (width - padX * 2) / bars.length;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width, height }}
    >
      {bars.map((bar, i) => {
        const barHeight = (bar.value / max) * maxBar;
        const left = padX + i * slot + (slot - barWidth) / 2;
        const top = baseY - barHeight;
        const labelStyle = {
          position: 'absolute' as const,
          width: slot,
          left: padX + i * slot,
          textAlign: 'center' as const,
        };
        return (
          <View key={bar.key}>
            <View
              style={{
                position: 'absolute',
                left,
                top,
                width: barWidth,
                height: barHeight,
                backgroundColor: bar.color ?? colors.fac.primary,
              }}
            />
            <Text
              style={[
                facText.captionStrong,
                labelStyle,
                { top: top - LABEL_HEIGHT, color: colors.fac.ink },
              ]}
            >
              {bar.valueLabel}
            </Text>
            <Text
              style={[facText.caption, labelStyle, { top: baseY + 6, color: colors.fac.inkMuted }]}
            >
              {bar.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
