import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { colorsByMode, type ColorMode, type ColorTokens } from './colors';

export interface Theme {
  mode: ColorMode;
  colors: ColorTokens;
  /** Reduced motion: fades become instant swaps, no waveform animation (Foundations > Motion). */
  reducedMotion: boolean;
}

const defaultTheme: Theme = {
  mode: 'light',
  colors: colorsByMode.light,
  reducedMotion: false,
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
  const value = useMemo<Theme>(
    () => ({ mode, colors: colorsByMode[mode], reducedMotion }),
    [mode, reducedMotion],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
