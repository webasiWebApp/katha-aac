import { SvgXml } from 'react-native-svg';

import { pictogramSvg } from './pictogramData';

export type PictogramName = keyof typeof pictogramSvg;

export const pictogramNames = Object.keys(pictogramSvg) as PictogramName[];

export interface PictogramProps {
  symbol: PictogramName;
  /** Drawn on a 96 px grid in Figma; cells use 72 (L), 48 (M, S, strips), 44 (core keys), 52-56 (buttons). */
  size?: number;
  /** Pictograms are decorative inside labelled cells. Set a label only if used alone. */
  accessibilityLabel?: string;
}

/**
 * PLACEHOLDER pictogram (ARASAAC-style stand-in from Figma frame 3:230), not final artwork.
 * SVG markup is generated from assets/pictograms by scripts/gen-pictograms.js.
 */
export function Pictogram({ symbol, size = 96, accessibilityLabel }: PictogramProps) {
  const labelled = accessibilityLabel !== undefined;
  return (
    <SvgXml
      xml={pictogramSvg[symbol]}
      width={size}
      height={size}
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
    />
  );
}
