import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { colorsByMode, type ColorMode, type ColorTokens } from './colors';
import { colorTokens, type ColorTokenName } from './tokens';
import { space as spaceTokens, radius as radiusTokens, size as sizeTokens } from './size';
import {
  childText,
  facText,
  type TextStyleToken,
} from './typography';

const MODE_INDEX: Record<ColorMode, 0 | 1 | 2> = {
  light: 0,
  dark: 1,
  highContrast: 2,
};

/** Parse '#RRGGBB@0.nn' alpha shorthand → 'rgba(r,g,b,a)'. Plain hex passes through. */
function parseColorToken(raw: string): string {
  const atIdx = raw.indexOf('@');
  if (atIdx === -1) return raw;
  const hex = raw.slice(0, atIdx);
  const alpha = parseFloat(raw.slice(atIdx + 1));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const TEXT_MAP: Record<string, TextStyleToken> = {
  'Child/Message':      childText.message,
  'Child/LabelL':       childText.labelL,
  'Child/LabelM':       childText.labelM,
  'Child/LabelS':       childText.labelS,
  'Child/Strip':        childText.strip,
  'Child/Chip':         childText.chip,
  'Fac/Display':        facText.display,
  'Fac/Title':          facText.title,
  'Fac/Heading':        facText.heading,
  'Fac/Body':           facText.body,
  'Fac/BodyStrong':     facText.bodyStrong,
  'Fac/SinhalaBody':    facText.sinhalaBody,
  'Fac/SinhalaStrong':  facText.sinhalaStrong,
  'Fac/Caption':        facText.caption,
  'Fac/CaptionStrong':  facText.captionStrong,
  'Fac/Overline':       facText.overline,
  'Fac/Stat':           facText.stat,
};

export interface Theme {
  mode: ColorMode;
  /** Existing nested colour API — kept for backward compatibility. */
  colors: ColorTokens;
  /** Reduced motion: fades become instant swaps, no waveform animation (Foundations > Motion). */
  reducedMotion: boolean;
  /** Slash-key colour lookup. Returns the resolved colour string for the current mode. */
  color: (name: ColorTokenName) => string;
  /** Named text style lookup. E.g. text('Child/Message'). */
  text: (name: string) => TextStyleToken;
  space: typeof spaceTokens;
  radius: typeof radiusTokens;
  size: typeof sizeTokens;
}

const defaultColor = (mode: ColorMode) => (name: ColorTokenName): string => {
  const idx = MODE_INDEX[mode];
  return parseColorToken(colorTokens[name][idx]);
};

const defaultText = (name: string): TextStyleToken => {
  const found = TEXT_MAP[name];
  if (!found) throw new Error(`Unknown text style: ${name}`);
  return found;
};

const defaultTheme: Theme = {
  mode: 'light',
  colors: colorsByMode.light,
  reducedMotion: false,
  color: defaultColor('light'),
  text: defaultText,
  space: spaceTokens,
  radius: radiusTokens,
  size: sizeTokens,
};

const ThemeContext = createContext<Theme>(defaultTheme);

export interface ThemeProviderProps {
  mode?: ColorMode;
  reducedMotion?: boolean;
  children: ReactNode;
}

export function ThemeProvider({
  mode = 'light',
  reducedMotion = false,
  children,
}: ThemeProviderProps) {
  const value = useMemo<Theme>(() => {
    const idx = MODE_INDEX[mode];
    return {
      mode,
      colors: colorsByMode[mode],
      reducedMotion,
      color: (name: ColorTokenName) => parseColorToken(colorTokens[name][idx]),
      text: defaultText,
      space: spaceTokens,
      radius: radiusTokens,
      size: sizeTokens,
    };
  }, [mode, reducedMotion]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
