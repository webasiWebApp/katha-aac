import { fireEvent, screen } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';

import type { MeasureResult, MessageHistoryEntry } from '../types';
import { BarRow } from '../ui/BarRow';
import { LimitationBanner } from '../ui/LimitationBanner';
import { MessageHistoryRow } from '../ui/MessageHistoryRow';
import { MetricCard } from '../ui/MetricCard';
import { PeriodPicker, PeriodSheet } from '../ui/PeriodPicker';
import { SectionHeader } from '../ui/SectionHeader';
import { WordChip } from '../ui/WordChip';

// --- MetricCard ---

const lockedResult: MeasureResult = {
  id: 'test',
  value: null,
  locked: true,
  sessionsSoFar: 3,
};

const countResult: MeasureResult = {
  id: 'test',
  value: 42,
  locked: false,
  sessionsSoFar: 8,
};

const rateResult: MeasureResult = {
  id: 'test',
  value: null,
  numerator: 18,
  denominator: 29,
  locked: false,
  sessionsSoFar: 6,
};

describe('MetricCard', () => {
  it('locked: renders "Shown after 5 sessions (3 so far)"', async () => {
    await renderThemed(<MetricCard result={lockedResult} label="Messages sent" />);
    expect(screen.getByText('Shown after 5 sessions (3 so far)')).toBeTruthy();
    expect(screen.getByText('Messages sent')).toBeTruthy();
  });

  it('count: renders the integer value', async () => {
    await renderThemed(<MetricCard result={countResult} label="Messages sent" />);
    expect(screen.getByText('42')).toBeTruthy();
  });

  it('rate: renders percentage and "N of D opportunities"', async () => {
    await renderThemed(<MetricCard result={rateResult} label="Confirmed as meant" />);
    expect(screen.getByText('62%')).toBeTruthy();
    expect(screen.getByText('18 of 29 opportunities')).toBeTruthy();
  });
});

// --- LimitationBanner ---

describe('LimitationBanner', () => {
  it('renders the standard disclaimer text as a labelled element', async () => {
    await renderThemed(<LimitationBanner />);
    expect(
      screen.getByLabelText(
        'This report describes recorded app activity, not all communication. Usage statistics alone do not show language development.',
      ),
    ).toBeTruthy();
  });
});

// --- PeriodPicker ---

describe('PeriodPicker', () => {
  it('is a button with the period label', async () => {
    const onPress = jest.fn();
    await renderThemed(<PeriodPicker label="Last 7 days" onPress={onPress} />);
    const btn = screen.getByRole('button', { name: 'Period: Last 7 days' });
    expect(btn).toBeTruthy();
    await fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('PeriodSheet', () => {
  it('renders 4 options and marks the selected one', async () => {
    const onSelect = jest.fn();
    await renderThemed(
      <PeriodSheet selectedPreset="7d" onSelect={onSelect} onClose={jest.fn()} />,
    );
    const selected = screen.getByRole('radio', { name: 'Last 7 days' });
    expect(selected.props.accessibilityState).toMatchObject({ selected: true });
    const today = screen.getByRole('radio', { name: 'Today' });
    await fireEvent.press(today);
    expect(onSelect).toHaveBeenCalledWith('today');
  });
});

// --- SectionHeader ---

describe('SectionHeader', () => {
  it('report kind renders title and subtitle', async () => {
    await renderThemed(
      <SectionHeader kind="report" title="Top words" subtitle="Most used this week" />,
    );
    expect(screen.getByText('Top words')).toBeTruthy();
    expect(screen.getByText('Most used this week')).toBeTruthy();
  });

  it('builder kind renders title and a toggle', async () => {
    const onToggle = jest.fn();
    await renderThemed(
      <SectionHeader
        kind="builder"
        title="Word list"
        toggleValue={true}
        onToggle={onToggle}
        toggleLabel="Show word list"
      />,
    );
    expect(screen.getByText('Word list')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Show word list' })).toBeTruthy();
  });
});

// --- BarRow ---

describe('BarRow', () => {
  it('renders label, value label and a progressbar', async () => {
    await renderThemed(<BarRow label="Home" value={8} max={20} valueLabel="8" />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    const bar = screen.getByRole('progressbar', { name: 'Home' });
    expect(bar.props.accessibilityValue).toMatchObject({ min: 0, max: 100, now: 40 });
  });
});

// --- WordChip ---

describe('WordChip', () => {
  it('shows the word and count with a combined accessibility label', async () => {
    await renderThemed(<WordChip word="වතුර" count={12} />);
    expect(screen.getByLabelText('වතුර, used 12 times')).toBeTruthy();
    expect(screen.getByText('වතුර')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
  });
});

// --- MessageHistoryRow ---

const entry: MessageHistoryEntry = {
  id: 'msg-1',
  sentence: 'මට වතුර ඕනේ',
  symbolCount: 3,
  at: '2026-10-20T01:42:00.000Z',
  offsetMin: 330,
  source: 'independent',
  answer: 'meant',
};

describe('MessageHistoryRow', () => {
  it('renders sentence, meta and the "Meant" chip', async () => {
    await renderThemed(
      <MessageHistoryRow entry={entry} timeLabel="Tue 20 Oct · 07:12" />,
    );
    expect(screen.getByText('මට වතුර ඕනේ')).toBeTruthy();
    expect(screen.getByText('Tue 20 Oct · 07:12 · 3 symbols · independent')).toBeTruthy();
    expect(screen.getByLabelText('Meant')).toBeTruthy();
  });

  it('renders "Not answered" when answer is null', async () => {
    await renderThemed(
      <MessageHistoryRow
        entry={{ ...entry, answer: null }}
        timeLabel="Tue 20 Oct · 07:12"
      />,
    );
    expect(screen.getByLabelText('Not answered')).toBeTruthy();
  });
});
