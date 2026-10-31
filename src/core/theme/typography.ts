// Source: Figma text styles (page 02 Foundations > Type ramp).
// Child/* : Sinhala, 22-32 sp, line height 150%.   Fac/* : Noto Sans (+ Sinhala variants).
// Figma uses Yaldevi as a stand-in for Noto Sans Sinhala; code uses Noto Sans Sinhala.
// Font files live in assets/fonts and are embedded by the expo-font config plugin (app.json),
// so the font family name equals the file name.

import type { TextStyle } from 'react-native';

export const fontFamily = {
  sinhalaRegular: 'NotoSansSinhala_400Regular',
  sinhalaMedium: 'NotoSansSinhala_500Medium',
  sinhalaSemiBold: 'NotoSansSinhala_600SemiBold',
  sinhalaBold: 'NotoSansSinhala_700Bold',
  latinRegular: 'NotoSans_400Regular',
  latinSemiBold: 'NotoSans_600SemiBold',
  latinBold: 'NotoSans_700Bold',
} as const;

export type TextStyleToken = Required<Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight'>> &
  Pick<TextStyle, 'letterSpacing'>;

/** Figma gives line height as a ratio; React Native needs dp. */
const style = (family: string, fontSize: number, lineHeightRatio: number): TextStyleToken => ({
  fontFamily: family,
  fontSize,
  lineHeight: fontSize * lineHeightRatio,
});

export const childText = {
  message: style(fontFamily.sinhalaSemiBold, 32, 1.5),
  labelL: style(fontFamily.sinhalaSemiBold, 28, 1.5),
  labelM: style(fontFamily.sinhalaSemiBold, 24, 1.5),
  labelS: style(fontFamily.sinhalaSemiBold, 22, 1.5),
  strip: style(fontFamily.sinhalaSemiBold, 22, 1.5),
  chip: style(fontFamily.sinhalaMedium, 20, 1.5),
} as const;

export const facText = {
  display: style(fontFamily.latinBold, 40, 1.2),
  title: style(fontFamily.latinSemiBold, 22, 1.3),
  heading: style(fontFamily.latinSemiBold, 18, 1.35),
  body: style(fontFamily.latinRegular, 16, 1.5),
  bodyStrong: style(fontFamily.latinSemiBold, 16, 1.5),
  sinhalaBody: style(fontFamily.sinhalaRegular, 16, 1.5),
  sinhalaStrong: style(fontFamily.sinhalaSemiBold, 16, 1.5),
  caption: style(fontFamily.latinRegular, 13, 1.4),
  captionStrong: style(fontFamily.latinSemiBold, 13, 1.4),
  // Figma reports letterSpacing 6 with no unit; read as 6 % of 12 sp (0.72). See docs.
  overline: { ...style(fontFamily.latinSemiBold, 12, 1.4), letterSpacing: 0.72 },
  stat: style(fontFamily.latinBold, 28, 1.2),
} as const;

export type ChildTextName = keyof typeof childText;
export type FacTextName = keyof typeof facText;
