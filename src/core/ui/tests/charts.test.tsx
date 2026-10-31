// Charts take their data from props. The numbers here are sample data (as in Figma).
import { screen } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';

import { BarChart, Heatmap, LineChart } from '../charts';

const yTicks = [0, 2, 4, 6, 8].map((v) => ({ value: v, label: `${v} s` }));

describe('LineChart', () => {
  it.each([
    ['Phone', 328, 210],
    ['Tablet', 600, 280],
  ])(
    'renders three series at %s size with direct labels and no legend',
    async (_name, width, height) => {
      await renderThemed(
        <LineChart
          width={width}
          height={height}
          yTicks={yTicks}
          xCaption="Sessions 1 → 20"
          baseline={{ fraction: 0.19, label: 'Baseline' }}
          series={[
            { key: 'a', label: 'A · fixed', color: '#475569', values: [5, 4.5, 4, 3.8] },
            {
              key: 'b',
              label: 'B · re-ranked',
              color: '#B45309',
              values: [5, 4, 3, 2.5],
              dashed: true,
            },
            { key: 'c', label: 'C · strip', color: '#7C3AED', values: [5, 4.2, 3.4, 3] },
          ]}
          accessibilityLabel="Learning curve"
        />,
      );
      expect(screen.getByLabelText('Learning curve')).toBeTruthy();
      expect(screen.getByText('A · fixed')).toBeTruthy();
      expect(screen.getByText('Baseline')).toBeTruthy();
      expect(screen.getByText('Sessions 1 → 20')).toBeTruthy();
      expect(screen.getByText('8 s')).toBeTruthy();
    },
  );

  it('single series has no direct label column', async () => {
    await renderThemed(
      <LineChart
        width={328}
        height={210}
        yTicks={[0, 10, 20, 30, 40].map((v) => ({ value: v, label: String(v) }))}
        xCaption="Weeks 1 → 14"
        series={[{ key: 'p', label: 'Progress', color: '#2563EB', values: [10, 18, 24, 32] }]}
        accessibilityLabel="Progress over weeks"
      />,
    );
    expect(screen.queryByText('Progress')).toBeNull();
    expect(screen.getByText('Weeks 1 → 14')).toBeTruthy();
  });
});

describe('BarChart', () => {
  it('renders value and category labels for every bar', async () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    await renderThemed(
      <BarChart
        width={328}
        height={180}
        accessibilityLabel="Messages per day"
        bars={days.map((d, i) => ({ key: d, label: d, value: 8 + i, valueLabel: String(8 + i) }))}
      />,
    );
    for (const d of days) expect(screen.getByText(d)).toBeTruthy();
    expect(screen.getByText('14')).toBeTruthy();
  });

  it('grouped conditions use 56 dp bars with their own colours', async () => {
    await renderThemed(
      <BarChart
        width={328}
        height={180}
        barWidth={56}
        accessibilityLabel="Median seconds by condition"
        bars={[
          { key: 'a', label: 'A', value: 2.4, valueLabel: '2.4', color: '#475569' },
          { key: 'b', label: 'B', value: 3.1, valueLabel: '3.1', color: '#B45309' },
          { key: 'c', label: 'C', value: 2.2, valueLabel: '2.2', color: '#7C3AED' },
        ]}
      />,
    );
    expect(screen.getByText('3.1')).toBeTruthy();
  });
});

describe('Heatmap', () => {
  it('grid kind renders a label and value per filled cell and an empty cell without text', async () => {
    await renderThemed(
      <Heatmap
        kind="grid"
        accessibilityLabel="Time to find each cell"
        rows={[
          [
            { label: 'මට', valueLabel: '1.8 s', level: 1 },
            { label: 'සතුටුයි', valueLabel: '3.4 s', level: 4 },
            null,
          ],
        ]}
      />,
    );
    expect(screen.getByText('මට')).toBeTruthy();
    expect(screen.getByText('3.4 s')).toBeTruthy();
  });

  it('routine kind renders hour captions and a row label', async () => {
    await renderThemed(
      <Heatmap
        kind="routine"
        accessibilityLabel="Usage by routine and hour"
        hours={['06', '08', '10']}
        rows={[{ label: 'Breakfast', levels: [2, 5, null] }]}
      />,
    );
    expect(screen.getByText('Breakfast')).toBeTruthy();
    expect(screen.getByText('08')).toBeTruthy();
  });
});
