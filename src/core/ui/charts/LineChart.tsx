import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { facText, useTheme } from '@/core/theme';

export interface LineSeries {
  key: string;
  /** Direct label drawn at the end of the line (no legend). */
  label: string;
  /** A chart colour token, for example colors.chart.aSlate or colors.fac.primary. */
  color: string;
  values: readonly number[];
  /** Condition B is dashed (5 / 4) in Figma. */
  dashed?: boolean;
}

export interface LineChartProps {
  width: number;
  height: number;
  series: readonly LineSeries[];
  /** Y axis ticks from bottom to top; `value` is in the same unit as the series. */
  yTicks: readonly { value: number; label: string }[];
  /** Caption under the plot, for example "Sessions 1 → 20". */
  xCaption: string;
  /** Shaded baseline phase from the left edge (fraction of the plot width) with a caption. */
  baseline?: { fraction: number; label: string };
  accessibilityLabel: string;
}

// Geometry read from Figma 7:652 (Phone 328 x 210, Tablet 600 x 280).
const AXIS_WIDTH = 34;
const TOP = 12;
const BOTTOM_PAD = 30;
const RIGHT_PAD_LABELLED = 96;
const RIGHT_PAD_SINGLE = 24;

/** Learning-curve line chart (Figma 7:652). Sample data only; values come from props. */
export function LineChart({
  width,
  height,
  series,
  yTicks,
  xCaption,
  baseline,
  accessibilityLabel,
}: LineChartProps) {
  const { colors } = useTheme();
  const fac = colors.fac;
  const labelled = series.length > 1;
  const plotLeft = AXIS_WIDTH;
  const plotRight = width - (labelled ? RIGHT_PAD_LABELLED : RIGHT_PAD_SINGLE);
  const plotTop = TOP;
  const plotBottom = height - BOTTOM_PAD;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const yMax = yTicks[yTicks.length - 1]?.value ?? 1;
  const yMin = yTicks[0]?.value ?? 0;
  const yOf = (v: number) => plotBottom - ((v - yMin) / (yMax - yMin)) * plotHeight;

  const pathFor = (values: readonly number[]) =>
    values
      .map((v, i) => {
        const x = plotLeft + (values.length === 1 ? 0 : (i / (values.length - 1)) * plotWidth);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${yOf(v).toFixed(1)}`;
      })
      .join(' ');

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width, height }}
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {baseline ? (
          <Rect
            x={plotLeft}
            y={plotTop}
            width={plotWidth * baseline.fraction}
            height={plotHeight}
            fill={colors.chart.baseline}
          />
        ) : null}
        {yTicks.map((tick) => (
          <Line
            key={tick.value}
            x1={plotLeft}
            x2={plotRight}
            y1={yOf(tick.value)}
            y2={yOf(tick.value)}
            stroke={fac.border}
            strokeWidth={1}
          />
        ))}
        {series.map((s) => (
          <Path
            key={s.key}
            d={pathFor(s.values)}
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            fill="none"
          />
        ))}
      </Svg>
      {yTicks.map((tick) => (
        <Text
          key={`t${tick.value}`}
          style={[
            facText.caption,
            styles.abs,
            { left: 0, top: yOf(tick.value) - 9, color: fac.inkMuted },
          ]}
        >
          {tick.label}
        </Text>
      ))}
      {baseline ? (
        <Text
          style={[
            facText.caption,
            styles.abs,
            { left: plotLeft + 4, top: plotTop + 2, color: fac.inkMuted },
          ]}
        >
          {baseline.label}
        </Text>
      ) : null}
      {labelled
        ? series.map((s) => {
            const last = s.values[s.values.length - 1] ?? yMin;
            return (
              <Text
                key={`l${s.key}`}
                style={[
                  facText.captionStrong,
                  styles.abs,
                  { left: plotRight + 6, top: yOf(last) - 9, color: s.color },
                ]}
              >
                {s.label}
              </Text>
            );
          })
        : null}
      <Text
        style={[
          facText.caption,
          styles.abs,
          { left: plotLeft, top: height - 18, color: fac.inkMuted },
        ]}
      >
        {xCaption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute' } });
