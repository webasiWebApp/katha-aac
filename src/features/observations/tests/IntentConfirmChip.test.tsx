import { fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { renderThemed, touchSize } from '@/core/theme/testUtils';

import { IntentConfirmChip } from '../index';

const chip = (
  state: 'visible' | 'dismissing',
  handlers = { m: jest.fn(), n: jest.fn(), u: jest.fn() },
) => (
  <IntentConfirmChip
    state={state}
    question="Meant this?"
    meantLabel="Meant"
    notMeantLabel="Not meant"
    unsureLabel="Unsure"
    onMeant={handlers.m}
    onNotMeant={handlers.n}
    onUnsure={handlers.u}
  />
);

describe('IntentConfirmChip', () => {
  it.each(['visible', 'dismissing'] as const)(
    'state %s has three labelled 48 x 48 answers',
    async (state) => {
      await renderThemed(chip(state));
      for (const name of ['Meant', 'Not meant', 'Unsure']) {
        expect(touchSize(screen.getByRole('button', { name }))).toEqual({ width: 48, height: 48 });
      }
      const opacity = StyleSheet.flatten(screen.getByLabelText('Meant this?').props.style).opacity;
      expect(opacity).toBe(state === 'dismissing' ? 0.45 : 1);
    },
  );

  it('reports each answer', async () => {
    const handlers = { m: jest.fn(), n: jest.fn(), u: jest.fn() };
    await renderThemed(chip('visible', handlers));
    await fireEvent.press(screen.getByRole('button', { name: 'Meant' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Not meant' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Unsure' }));
    expect(handlers.m).toHaveBeenCalledTimes(1);
    expect(handlers.n).toHaveBeenCalledTimes(1);
    expect(handlers.u).toHaveBeenCalledTimes(1);
  });
});
