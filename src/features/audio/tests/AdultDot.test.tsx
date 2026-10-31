import { screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { lightColors } from '@/core/theme';
import { renderThemed } from '@/core/theme/testUtils';

import { AdultDot } from '../index';

describe('AdultDot', () => {
  it('is a 10 dp adult/dot circle', async () => {
    await renderThemed(<AdultDot accessibilityLabel="TTS voice used" />);
    const style = StyleSheet.flatten(screen.getByLabelText('TTS voice used').props.style);
    expect(style).toMatchObject({
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: lightColors.adult.dot,
    });
  });

  it('is hidden from assistive tech unless it has a label (low salience)', async () => {
    await renderThemed(<AdultDot />);
    expect(screen.toJSON()).toMatchObject({
      props: { accessible: false, importantForAccessibility: 'no-hide-descendants' },
    });
  });
});
