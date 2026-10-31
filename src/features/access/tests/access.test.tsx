import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { lightColors } from '@/core/theme';
import { renderThemed, touchSize } from '@/core/theme/testUtils';

import { AdultGate, ConsentBanner } from '../index';

describe('AdultGate', () => {
  it('hold step is a 220 x 220 surface that fires after the hold', async () => {
    const onHoldComplete = jest.fn();
    await renderThemed(
      <AdultGate
        step="hold"
        holdLabel="Hold 3 s"
        onHoldComplete={onHoldComplete}
        accessibilityLabel="Adult gate"
      />,
    );
    const gate = screen.getByRole('button', { name: 'Adult gate' });
    expect(touchSize(gate)).toEqual({ width: 220, height: 220 });
    expect(screen.getByText('Hold 3 s')).toBeTruthy();
    const user = userEvent.setup();
    await user.press(gate);
    await user.longPress(gate, { duration: 1000 });
    expect(onHoldComplete).not.toHaveBeenCalled();
    await user.longPress(gate, { duration: 3100 });
    expect(onHoldComplete).toHaveBeenCalledTimes(1);
  }, 15000);

  const check = (pinFilled: number, onHoldChange = jest.fn()) => (
    <AdultGate
      step="check"
      overline="ADULT CHECK"
      title="Adult check"
      instruction="Press and hold both buttons together for 2 seconds."
      holdHereLabel="Hold here"
      orPinLabel="or PIN"
      footnote="Wrong or no answer returns to the grid silently."
      pinFilled={pinFilled}
      onHoldChange={onHoldChange}
    />
  );

  it('check step shows two 236 x 88 hold buttons and reports each hold', async () => {
    const onHoldChange = jest.fn();
    await renderThemed(check(2, onHoldChange));
    const buttons = screen.getAllByRole('button', { name: 'Hold here' });
    expect(buttons).toHaveLength(2);
    for (const b of buttons) expect(touchSize(b)).toEqual({ width: 236, height: 88 });
    await fireEvent(buttons[0] as never, 'pressIn');
    await fireEvent(buttons[1] as never, 'pressIn');
    await fireEvent(buttons[0] as never, 'pressOut');
    expect(onHoldChange.mock.calls).toEqual([
      [0, true],
      [1, true],
      [0, false],
    ]);
  });

  it.each([0, 1, 2, 3, 4])('fills %i of the 4 PIN dots', async (filled) => {
    await renderThemed(check(filled));
    const solid = [0, 1, 2, 3].filter(
      (i) =>
        StyleSheet.flatten(screen.getByTestId(`pin-dot-${i}`).props.style).backgroundColor ===
        lightColors.fac.ink,
    );
    expect(solid).toHaveLength(filled);
  });

  it('is a modal card and says a wrong answer returns silently (R11)', async () => {
    await renderThemed(check(0));
    expect(screen.getByLabelText('Adult check').props.accessibilityViewIsModal).toBe(true);
    expect(screen.getByText('Wrong or no answer returns to the grid silently.')).toBeTruthy();
  });
});

describe('ConsentBanner', () => {
  it('reads as one labelled notice', async () => {
    await renderThemed(
      <ConsentBanner
        title="Data stays on this device"
        body="Research logging is optional and can be withdrawn at any time."
      />,
    );
    expect(
      screen.getByLabelText(
        'Data stays on this device. Research logging is optional and can be withdrawn at any time.',
      ),
    ).toBeTruthy();
  });
});
