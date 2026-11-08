import { screen } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';

import { Pictogram, pictogramNames } from '../index';

describe('Pictogram (placeholder artwork)', () => {
  it('has the 45 symbols from the Figma pictogram frame (3:230) plus the in-house Replay art', () => {
    expect(pictogramNames).toHaveLength(46);
    expect(pictogramNames).toContain('replay');
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

  it('renders a labelled fallback square when the SVG is missing at runtime (5.7)', async () => {
    // Cast to bypass TypeScript — simulates a vocabulary symbol with no artwork yet.
    const missing = 'unknown_symbol_xyz' as Parameters<typeof Pictogram>[0]['symbol'];
    await renderThemed(
      <Pictogram symbol={missing} fallbackLabel="නොදන්නා" accessibilityLabel="placeholder" />,
    );
    expect(screen.getByTestId('pictogram-fallback')).toBeTruthy();
    expect(screen.getByText('නොදන්නා')).toBeTruthy();
    expect(screen.getByLabelText('placeholder')).toBeTruthy();
  });
});
