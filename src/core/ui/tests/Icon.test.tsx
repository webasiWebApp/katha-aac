import { screen } from '@testing-library/react-native';

import { renderThemed } from '@/core/theme/testUtils';

import { Icon, iconNames } from '../Icon';
import { iconPaths } from '../iconPaths';

describe('Icon', () => {
  it('has all 55 UI icons from the Figma icon frame (3:2)', () => {
    expect(iconNames).toHaveLength(55);
    for (const name of iconNames) expect(iconPaths[name].length).toBeGreaterThan(0);
  });

  it.each(iconNames)('renders icon "%s"', async (name) => {
    await renderThemed(<Icon name={name} color="#1F2933" />);
  });

  it('is decorative unless a label is given', async () => {
    await renderThemed(<Icon name="home" color="#000000" />);
    expect(screen.queryByLabelText('Home')).toBeNull();
  });

  it('exposes an image role and label when labelled', async () => {
    await renderThemed(<Icon name="home" color="#000000" accessibilityLabel="Home" />);
    expect(screen.getByLabelText('Home')).toBeTruthy();
  });
});
