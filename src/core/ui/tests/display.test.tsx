// Display-only facilitator components: Chip, OfflineBadge, Card, ProgressBar, StatTile,
// EmptyState, Toast, NumericKeypad. They are not touch targets (except Keypad), so the checks
// are rendering, labels and roles.
import { fireEvent, screen } from '@testing-library/react-native';

import { renderThemed, touchSize } from '@/core/theme/testUtils';

import { Card } from '../Card';
import { Chip, type ChipTone } from '../Chip';
import { EmptyState } from '../EmptyState';
import { NumericKeypad } from '../NumericKeypad';
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

describe('NumericKeypad', () => {
  it('renders 9 digit keys plus 0 and backspace (3×4 layout, empty key for spacing)', async () => {
    const onKey = jest.fn();
    await renderThemed(<NumericKeypad onKey={onKey} />);
    for (const digit of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
      expect(screen.getByRole('button', { name: digit })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('each key is 72 × 56 dp', async () => {
    await renderThemed(<NumericKeypad onKey={jest.fn()} />);
    const key = screen.getByRole('button', { name: '5' });
    expect(touchSize(key)).toEqual({ width: 72, height: 56 });
  });

  it('fires onKey with the correct digit', async () => {
    const onKey = jest.fn();
    await renderThemed(<NumericKeypad onKey={onKey} />);
    await fireEvent.press(screen.getByRole('button', { name: '7' }));
    expect(onKey).toHaveBeenCalledWith('7');
  });

  it('fires onKey("backspace") for the Delete key', async () => {
    const onKey = jest.fn();
    await renderThemed(<NumericKeypad onKey={onKey} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(onKey).toHaveBeenCalledWith('backspace');
  });

  it('disabled keypad ignores presses', async () => {
    const onKey = jest.fn();
    await renderThemed(<NumericKeypad onKey={onKey} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: '1' }));
    expect(onKey).not.toHaveBeenCalled();
  });
});
