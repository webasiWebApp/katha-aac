import { screen } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';

import { PhaseTimeline } from '../index';

const phases = [
  { key: 'baseline', label: 'Baseline' },
  { key: 'alternating', label: 'Alternating' },
  { key: 'probes', label: 'Probes' },
  { key: 'maintenance', label: 'Maintenance' },
];
const statusLabels = { done: 'Completed', current: 'Current phase', upcoming: 'Upcoming' };

describe('PhaseTimeline', () => {
  it.each(phases.map((p, i) => [p.key, i] as const))(
    'current = %s marks earlier phases done and later ones upcoming',
    async (currentKey, index) => {
      await renderThemed(
        <PhaseTimeline phases={phases} currentKey={currentKey} statusLabels={statusLabels} />,
      );
      phases.forEach((phase, i) => {
        const status = i < index ? 'Completed' : i === index ? 'Current phase' : 'Upcoming';
        const step = screen.getByLabelText(`${status}: ${phase.label}`);
        expect(step.props.accessibilityState).toMatchObject({ selected: i === index });
      });
    },
  );

  it('exposes the four steps as a list', async () => {
    await renderThemed(
      <PhaseTimeline phases={phases} currentKey="baseline" statusLabels={statusLabels} />,
    );
    expect(screen.toJSON()).toMatchObject({ props: { accessibilityRole: 'list' } });
  });
});
