import { fireEvent, screen } from '@testing-library/react-native';

import { renderThemed, touchSize } from '@/core/theme/testUtils';

import { Button, type ButtonSize, type ButtonVariant } from '../Button';

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const sizes: ButtonSize[] = ['L', 'M'];

describe('Button', () => {
  it.each(variants.flatMap((v) => sizes.map((s) => [v, s] as const)))(
    'renders %s / %s with role, label and a touch target of at least 48 dp',
    async (variant, size) => {
      const onPress = jest.fn();
      await renderThemed(<Button label="Save" onPress={onPress} variant={variant} size={size} />);
      const button = screen.getByRole('button', { name: 'Save' });
      expect(button.props.accessibilityState).toMatchObject({ disabled: false });
      const sized = touchSize(button);
      expect(sized?.height).toBeGreaterThanOrEqual(48);
      expect(sized?.height).toBe(size === 'L' ? 56 : 48);
      await fireEvent.press(button);
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('reports the disabled state and ignores presses', async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Save" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses an explicit accessibility label when given', async () => {
    await renderThemed(
      <Button label="OK" accessibilityLabel="Confirm move" onPress={() => undefined} icon="plus" />,
    );
    expect(screen.getByRole('button', { name: 'Confirm move' })).toBeTruthy();
  });
});
