import { screen } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';

import { Pictogram, pictogramNames } from '../index';

describe('Pictogram (placeholder artwork)', () => {
  it('has all 45 symbols from the Figma pictogram frame (3:230)', () => {
    expect(pictogramNames).toHaveLength(45);
  });

  it.each(pictogramNames)('renders "%s"', async (symbol) => {
    await renderThemed(<Pictogram symbol={symbol} size={48} />);
  });

  it('is decorative by default (hidden from screen readers)', async () => {
    await renderThemed(<Pictogram symbol="water" />);
    expect(screen.queryByRole('image')).toBeNull();
  });

  it('is exposed as an image when given a label', async () => {
    await renderThemed(<Pictogram symbol="water" accessibilityLabel="water" />);
    expect(screen.getByLabelText('water')).toBeTruthy();
  });
});
