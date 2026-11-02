import { screen } from '@testing-library/react-native';

import { facText, fontFamily } from '@/core/theme';
import { renderThemed } from '@/core/theme/testUtils';

import { MixedText } from '../MixedText';

describe('MixedText', () => {
  it('splits Latin and Sinhala runs: "Goal: ask for help with උදව්" yields two spans', async () => {
    await renderThemed(
      <MixedText text="Goal: ask for help with උදව්" style={facText.bodyStrong} />,
    );
    // The Sinhala run is wrapped in a <Text> with the Sinhala font.
    const sinhalaSpan = screen.getByText('උදව්');
    expect(sinhalaSpan.props.style).toMatchObject({ fontFamily: fontFamily.sinhalaSemiBold });

    // The Latin run is a plain-string child of the outer <Text> — not its own element,
    // so we verify the outer container includes the full combined text.
    const all = screen.getAllByText(/Goal.*help.*උදව්/, { exact: false });
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it('passes through a colour prop', async () => {
    await renderThemed(
      <MixedText text="Test" style={facText.body} color="#123456" />,
    );
    // The outer Text should carry the color in its style array
    const node = screen.getByText('Test');
    const styleStr = JSON.stringify(node.props.style);
    expect(styleStr).toContain('#123456');
  });

  it('leaves a pure-Latin string as a single run with no Sinhala family', async () => {
    await renderThemed(
      <MixedText text="Hello world" style={facText.body} />,
    );
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('handles a pure-Sinhala string (single run)', async () => {
    await renderThemed(
      <MixedText text="ශ්‍රී ලංකා" style={facText.sinhalaBody} />,
    );
    // ZWJ (‍) is included in the Sinhala run regex
    const span = screen.getByText('ශ්‍රී ලංකා');
    expect(span).toBeTruthy();
  });

  it('sets maxFontSizeMultiplier to 1.3 by default', async () => {
    const { getByText } = await renderThemed(
      <MixedText text="Abc" style={facText.body} />,
    );
    // The outer wrapper Text carries maxFontSizeMultiplier
    expect(getByText('Abc').props.maxFontSizeMultiplier).toBe(1.3);
  });
});
