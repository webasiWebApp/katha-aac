// Source: Figma variable collection "Size" (mode Default) + page 02 Foundations
// ("Spacing, radii and touch targets", tablet geometry). Values are dp.

export const space = { s4: 4, s8: 8, s12: 12, s16: 16, s24: 24, s32: 32, s48: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const size = {
  /** size/child-margin: child safe-area margin. */
  childMargin: 24,
  /** size/cell-min: absolute child minimum touch target (72 x 72). */
  cellMin: 72,
  /** size/cell-starter: minimum for the 3x4 starter grid (>= 120). */
  cellStarter: 120,
  /** size/target-fac: facilitator minimum touch target (48 x 48). */
  targetFac: 48,
  /** size/strip-band: prediction strip band height. */
  stripBand: 88,
  /** size/cell-gap: gap between cells on the 3x4 grid. */
  cellGap: 16,
} as const;

/** Child tablet geometry (1280x800 landscape), Foundations > Geometry. */
export const childGeometry = {
  messageRow: 96,
  messageRowSpeaking: 112,
  stripBand: 88,
  coreKeyRow: 88,
  gridArea: 444,
  zoneGap: 12,
  /** Cell sizes per grid, from Foundations. */
  cell: {
    L: { width: 296, height: 136 },
    M: { width: 236, height: 102 },
    S: { width: 195, height: 79 },
  },
  button: { speakWidth: 136, height: 96, iconButtonWidth: 96 },
} as const;

export type CellSize = keyof typeof childGeometry.cell;

/** Motion durations in ms, Foundations > Motion. */
export const motion = {
  pressFeedback: 120,
  rerankCrossFade: 300,
  clearFade: 400,
  idleFade: 1000,
  sentenceHold: 3000,
} as const;
