import { BarChart, Heatmap, LineChart, type HeatLevel } from '@/core/ui';
import { useTheme } from '@/core/theme';
import { getWordLabel } from '@/core/i18n';

import { GalleryPage, Labeled, Showcase } from '../GalleryLayout';
import { learningCurve, weekBars } from '../galleryData';

const lv = (...levels: HeatLevel[]) => levels;

export function ChartsScreen() {
  const { colors } = useTheme();
  const c = colors.chart;
  const three = [
    { key: 'a', label: 'A · fixed', color: c.aSlate, values: learningCurve.a },
    { key: 'b', label: 'B · re-ranked', color: c.bAmber, values: learningCurve.b, dashed: true },
    { key: 'c', label: 'C · strip', color: c.cViolet, values: learningCurve.c },
  ];
  const one = [
    { key: 'p', label: 'Progress', color: colors.fac.primary, values: learningCurve.weeks },
  ];

  return (
    <GalleryPage>
      <Showcase
        title="LineChart"
        node="7:652"
        wide
        note="SAMPLE DATA. Direct labels instead of a legend; baseline shaded."
      >
        {(
          [
            ['Phone / Three', 328, 210, three],
            ['Tablet / Three', 600, 280, three],
          ] as const
        ).map(([caption, width, height, series]) => (
          <Labeled key={caption} caption={`Size=${caption}`}>
            <LineChart
              width={width}
              height={height}
              series={series}
              yTicks={learningCurve.yTicks}
              xCaption="Sessions 1 → 20"
              baseline={{ fraction: 0.19, label: 'Baseline' }}
              accessibilityLabel="Median selection time per session for conditions A, B and C"
            />
          </Labeled>
        ))}
        {(
          [
            ['Phone / One', 328, 210],
            ['Tablet / One', 600, 280],
          ] as const
        ).map(([caption, width, height]) => (
          <Labeled key={caption} caption={`Size=${caption}`}>
            <LineChart
              width={width}
              height={height}
              series={one}
              yTicks={learningCurve.weekTicks}
              xCaption="Weeks 1 → 14"
              accessibilityLabel="Messages per week"
            />
          </Labeled>
        ))}
      </Showcase>

      <Showcase
        title="BarChart"
        node="7:690"
        wide
        note="SAMPLE DATA. Single accent, value labels on bars, no legend."
      >
        <Labeled caption="Kind=Week">
          <BarChart
            width={328}
            height={180}
            accessibilityLabel="Messages per day this week"
            bars={weekBars.map(([label, value]) => ({
              key: label,
              label,
              value,
              valueLabel: String(value),
            }))}
          />
        </Labeled>
        <Labeled caption="Kind=Conditions">
          <BarChart
            width={328}
            height={180}
            barWidth={56}
            accessibilityLabel="Median seconds by condition"
            bars={[
              { key: 'A', label: 'A', value: 2.4, valueLabel: '2.4', color: c.aSlate },
              { key: 'B', label: 'B', value: 3.1, valueLabel: '3.1', color: c.bAmber },
              { key: 'C', label: 'C', value: 2.2, valueLabel: '2.2', color: c.cViolet },
            ]}
          />
        </Labeled>
      </Showcase>

      <Showcase
        title="Heatmap"
        node="7:801"
        wide
        note="SAMPLE DATA. Single-hue (blue) lightness scale; dashed muted = no data."
      >
        <Labeled caption="Kind=Grid (median seconds to find each cell)">
          <Heatmap
            kind="grid"
            accessibilityLabel="Time to find each cell"
            rows={[
              [
                { label: getWordLabel('me'), valueLabel: '1.8 s', level: 1 },
                { label: getWordLabel('want'), valueLabel: '2.1 s', level: 2 },
                { label: getWordLabel('happy'), valueLabel: '3.4 s', level: 4 },
                { label: getWordLabel('more'), valueLabel: '2.0 s', level: 2 },
              ],
              [
                { label: getWordLabel('amma'), valueLabel: '2.6 s', level: 2 },
                { label: getWordLabel('eat'), valueLabel: '2.4 s', level: 2 },
                { label: getWordLabel('sad'), valueLabel: '4.1 s', level: 5 },
                null,
              ],
              [
                null,
                { label: getWordLabel('drink'), valueLabel: '2.9 s', level: 3 },
                null,
                { label: getWordLabel('go'), valueLabel: '3.0 s', level: 3 },
              ],
            ]}
          />
        </Labeled>
        <Labeled caption="Kind=Routine × time (usage counts)">
          <Heatmap
            kind="routine"
            accessibilityLabel="Usage by routine and hour"
            hours={['06', '08', '10', '12', '14', '16', '18', '20']}
            rows={[
              { label: 'Breakfast', levels: lv(2, 5, 1, null, null, null, null, null) },
              { label: 'School', levels: lv(null, 1, 3, 4, 2, null, null, null) },
              { label: 'Play', levels: lv(null, null, 1, 2, 3, 5, 3, null) },
            ]}
          />
        </Labeled>
      </Showcase>
    </GalleryPage>
  );
}
