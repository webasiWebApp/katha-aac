// Display-only facilitator components: Chip, OfflineBadge, Card, ProgressBar, StatTile,
// EmptyState, Toast. They are not touch targets, so the checks are rendering, labels and roles.
import { screen } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';

import { Card } from '../Card';
import { Chip, type ChipTone } from '../Chip';
import { EmptyState } from '../EmptyState';
import { OfflineBadge } from '../OfflineBadge';
import { ProgressBar } from '../ProgressBar';
import { StatTile, type StatTrend } from '../StatTile';
import { Toast } from '../Toast';

describe('Chip', () => {
  it.each<ChipTone>(['neutral', 'primary', 'success', 'warning', 'danger'])(
    'renders tone %s',
    async (tone) => {
      await renderThemed(<Chip label="Label" tone={tone} />);
      expect(screen.getByLabelText('Label')).toBeTruthy();
    },
  );
});

describe('OfflineBadge', () => {
  it('shows the caller-supplied label', async () => {
    await renderThemed(<OfflineBadge label="Works offline" />);
    expect(screen.getByLabelText('Works offline')).toBeTruthy();
  });
});

describe('Card', () => {
  it('renders title, body and children', async () => {
    await renderThemed(
      <Card title="Card title" body="Card body text in plain language.">
        <Chip label="inside" />
      </Card>,
    );
    expect(screen.getByText('Card title')).toBeTruthy();
    expect(screen.getByText('Card body text in plain language.')).toBeTruthy();
    expect(screen.getByLabelText('inside')).toBeTruthy();
  });
});

describe('ProgressBar', () => {
  it.each([0, 0.4, 1, 2, -1])('exposes a progressbar value for %s (clamped)', async (value) => {
    await renderThemed(<ProgressBar value={value} accessibilityLabel="Progress" />);
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    const now = Math.round(Math.min(1, Math.max(0, value)) * 100);
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 100, now });
  });
});

describe('StatTile', () => {
  it.each<StatTrend>(['up', 'down', 'flat'])(
    'renders trend %s with a combined label',
    async (trend) => {
      await renderThemed(
        <StatTile label="Messages sent" value="42" trend={trend} delta="+8 vs last week" />,
      );
      expect(screen.getByLabelText('Messages sent: 42, +8 vs last week')).toBeTruthy();
    },
  );
});

describe('EmptyState', () => {
  it('renders as one labelled element', async () => {
    await renderThemed(
      <EmptyState title="Not enough data yet" body="Insights appear after about 5 sessions." />,
    );
    expect(
      screen.getByLabelText('Not enough data yet. Insights appear after about 5 sessions.'),
    ).toBeTruthy();
  });
});

describe('Toast', () => {
  it('is an announced alert with the message as its label', async () => {
    await renderThemed(<Toast message="Saved on this device" />);
    const toast = screen.getByRole('alert', { name: 'Saved on this device' });
    expect(toast.props.accessibilityLiveRegion).toBe('polite');
  });
});
