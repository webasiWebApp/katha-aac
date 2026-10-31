import { fireEvent, screen } from '@testing-library/react-native';

import { renderThemed, touchSize } from '@/core/theme/testUtils';

import { SuggestionCard, type SuggestionConfidence } from '../index';

const confidences: SuggestionConfidence[] = ['high', 'medium', 'low'];

function card(
  confidence: SuggestionConfidence,
  held: boolean,
  fns = { p: jest.fn(), s: jest.fn(), a: jest.fn(), b: jest.fn() },
) {
  return (
    <SuggestionCard
      category="Vocabulary gap"
      confidence={confidence}
      confidenceLabel={`${confidence} confidence`}
      suggestion="You noted “kottu” 3 times but it isn't in the vocabulary. Add it to Food?"
      evidence="From 14 sessions, last 7 days"
      held={held}
      heldMessage="Held until the phase ends to keep the study fair"
      primary={{ label: 'Apply', onPress: fns.p }}
      secondary={{ label: 'See why', onPress: fns.s }}
      tertiary={[
        { label: 'Dismiss', onPress: fns.a },
        { label: 'Later', onPress: fns.b },
      ]}
    />
  );
}

describe('SuggestionCard', () => {
  it.each(confidences.flatMap((c) => [false, true].map((h) => [c, h] as const)))(
    'confidence %s, held %s shows evidence, confidence and manual actions',
    async (confidence, held) => {
      await renderThemed(card(confidence, held));
      expect(screen.getByText('From 14 sessions, last 7 days')).toBeTruthy();
      expect(screen.getByLabelText(`${confidence} confidence`)).toBeTruthy();
      expect(screen.getAllByRole('button')).toHaveLength(4);
      for (const b of screen.getAllByRole('button'))
        expect(touchSize(b).height).toBeGreaterThanOrEqual(48);
      const held_ = screen.queryByText('Held until the phase ends to keep the study fair');
      expect(held_ === null).toBe(!held);
      expect(screen.getByRole('button', { name: 'Apply' }).props.accessibilityState).toMatchObject({
        disabled: held,
      });
    },
  );

  it('nothing auto-applies: a press is the only way to fire an action', async () => {
    const fns = { p: jest.fn(), s: jest.fn(), a: jest.fn(), b: jest.fn() };
    await renderThemed(card('high', false, fns));
    expect(fns.p).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Apply' }));
    expect(fns.p).toHaveBeenCalledTimes(1);
  });

  it('held blocks the primary action', async () => {
    const fns = { p: jest.fn(), s: jest.fn(), a: jest.fn(), b: jest.fn() };
    await renderThemed(card('medium', true, fns));
    await fireEvent.press(screen.getByRole('button', { name: 'Apply' }));
    expect(fns.p).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'See why' }));
    expect(fns.s).toHaveBeenCalledTimes(1);
  });
});
