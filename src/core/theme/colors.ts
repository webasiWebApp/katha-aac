// Source: Figma variable collection "Color" (modes Light / Dark / High-contrast).
// File dTGxZvGYOISN9pZA3JlNLr, page 02 Foundations. Values are copied, not invented.
// 8-digit hex = #RRGGBBAA (supported by React Native).

export type ColorMode = 'light' | 'dark' | 'highContrast';

export interface ColorTokens {
  child: {
    bg: string;
    surface: string;
    ink: string;
    inkMuted: string;
    cellBorder: string;
    selected: string;
    selectedSoft: string;
    inkFaint: string;
    band: string;
    stripBg: string;
    stripBorder: string;
    placeholder: string;
    messageBg: string;
  };
  /** Word-class colours: a 6 px edge only, never a full background (R5). */
  classTint: {
    people: string;
    action: string;
    describing: string;
    thing: string;
    core: string;
    folder: string;
  };
  fac: {
    bg: string;
    surface: string;
    ink: string;
    inkMuted: string;
    border: string;
    primary: string;
    primarySoft: string;
    onPrimary: string;
    success: string;
    warning: string;
    danger: string;
    successSoft: string;
    warningSoft: string;
    dangerSoft: string;
    muted: string;
  };
  chart: {
    aSlate: string;
    bAmber: string;
    cViolet: string;
    heat1: string;
    heat2: string;
    heat3: string;
    heat4: string;
    heat5: string;
    baseline: string;
  };
  adult: { chipBg: string; chipInk: string; dot: string };
  note: { bg: string; border: string };
}

export const lightColors: ColorTokens = {
  child: {
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    ink: '#1F2933',
    inkMuted: '#52606D',
    cellBorder: '#D9D4CC',
    selected: '#2563EB',
    selectedSoft: '#2563EB1A',
    inkFaint: '#52606D73',
    band: '#F2EEE7',
    stripBg: '#EEE8FB',
    stripBorder: '#8E7CC3',
    placeholder: '#F1EDE6',
    messageBg: '#FFFFFF',
  },
  classTint: {
    people: '#F2C94C',
    action: '#6FCF97',
    describing: '#56CCF2',
    thing: '#F2994A',
    core: '#BB6BD9',
    folder: '#52606D80',
  },
  fac: {
    bg: '#F5F6F8',
    surface: '#FFFFFF',
    ink: '#1F2933',
    inkMuted: '#52606D',
    border: '#E1E4E8',
    primary: '#2563EB',
    primarySoft: '#EEF3FE',
    onPrimary: '#FFFFFF',
    success: '#15803D',
    warning: '#B45309',
    danger: '#B91C1C',
    successSoft: '#EEF8F1',
    warningSoft: '#FEF5EC',
    dangerSoft: '#FBEAEA',
    muted: '#EEF0F3',
  },
  chart: {
    aSlate: '#475569',
    bAmber: '#B45309',
    cViolet: '#7C3AED',
    heat1: '#E3ECFD',
    heat2: '#BFD3FA',
    heat3: '#8FB1F5',
    heat4: '#5B8DEE',
    heat5: '#2557D6',
    baseline: '#52606D1A',
  },
  adult: { chipBg: '#E5E7EB', chipInk: '#4B5563', dot: '#4B556399' },
  note: { bg: '#FFF8DB', border: '#E6C84F' },
};

export const darkColors: ColorTokens = {
  child: {
    bg: '#15191E',
    surface: '#222831',
    ink: '#F3F4F6',
    inkMuted: '#AAB4BE',
    cellBorder: '#3B4450',
    selected: '#60A5FA',
    selectedSoft: '#60A5FA2E',
    inkFaint: '#AAB4BE73',
    band: '#1B2026',
    stripBg: '#2B2542',
    stripBorder: '#9D8DE6',
    placeholder: '#1E242B',
    messageBg: '#222831',
  },
  classTint: {
    people: '#F2C94C',
    action: '#6FCF97',
    describing: '#56CCF2',
    thing: '#F2994A',
    core: '#BB6BD9',
    folder: '#AAB4BE80',
  },
  fac: {
    bg: '#111418',
    surface: '#1C2128',
    ink: '#F3F4F6',
    inkMuted: '#AAB4BE',
    border: '#2F3640',
    primary: '#60A5FA',
    primarySoft: '#1E2A44',
    onPrimary: '#0B1220',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    successSoft: '#12301E',
    warningSoft: '#3A2A10',
    dangerSoft: '#3A1414',
    muted: '#242A32',
  },
  chart: {
    aSlate: '#94A3B8',
    bAmber: '#FBBF24',
    cViolet: '#A78BFA',
    heat1: '#1B2740',
    heat2: '#233A66',
    heat3: '#2D5196',
    heat4: '#3D6CC4',
    heat5: '#6F9BF1',
    baseline: '#AAB4BE24',
  },
  adult: { chipBg: '#2F3640', chipInk: '#C3CAD2', dot: '#C3CAD299' },
  note: { bg: '#3A3418', border: '#B59A2E' },
};

export const highContrastColors: ColorTokens = {
  child: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    ink: '#000000',
    inkMuted: '#1F1F1F',
    cellBorder: '#000000',
    selected: '#0033CC',
    selectedSoft: '#0033CC1F',
    inkFaint: '#1F1F1F99',
    band: '#FFFFFF',
    stripBg: '#FFFFFF',
    stripBorder: '#000000',
    placeholder: '#F2F2F2',
    messageBg: '#FFFFFF',
  },
  classTint: {
    people: '#B88A00',
    action: '#1F8A4C',
    describing: '#0E7FB0',
    thing: '#C25E00',
    core: '#8A2FB0',
    folder: '#1F1F1FB2',
  },
  fac: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    ink: '#000000',
    inkMuted: '#1F1F1F',
    border: '#000000',
    primary: '#0033CC',
    primarySoft: '#FFFFFF',
    onPrimary: '#FFFFFF',
    success: '#0B5A2A',
    warning: '#7A3700',
    danger: '#7F1010',
    successSoft: '#FFFFFF',
    warningSoft: '#FFFFFF',
    dangerSoft: '#FFFFFF',
    muted: '#F2F2F2',
  },
  chart: {
    aSlate: '#1F2937',
    bAmber: '#7A3700',
    cViolet: '#4C1D95',
    heat1: '#E3ECFD',
    heat2: '#BFD3FA',
    heat3: '#7FA3F2',
    heat4: '#3366E0',
    heat5: '#0033CC',
    baseline: '#00000014',
  },
  adult: { chipBg: '#FFFFFF', chipInk: '#000000', dot: '#000000CC' },
  note: { bg: '#FFFFFF', border: '#000000' },
};

export const colorsByMode: Record<ColorMode, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
  highContrast: highContrastColors,
};
