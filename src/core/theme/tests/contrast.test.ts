import { lightColors } from '../colors';
import { compositeOver } from '../colorUtil';

/** WCAG relative luminance of an opaque #RRGGBB colour. */
function luminance(hex: string): number {
  const n = hex.replace('#', '').slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const c = lightColors;

/** Text / background pairs used by the components (T-160). Light mode must be at least 4.5:1. */
const PAIRS: [string, string, string][] = [
  ['fac.ink on fac.bg', c.fac.ink, c.fac.bg],
  ['fac.ink on fac.surface', c.fac.ink, c.fac.surface],
  ['fac.inkMuted on fac.bg', c.fac.inkMuted, c.fac.bg],
  ['fac.inkMuted on fac.surface', c.fac.inkMuted, c.fac.surface],
  ['fac.onPrimary on fac.primary', c.fac.onPrimary, c.fac.primary],
  ['fac.primary on fac.surface (ghost button)', c.fac.primary, c.fac.surface],
  ['fac.primary on fac.primarySoft (chip)', c.fac.primary, c.fac.primarySoft],
  ['fac.success on fac.successSoft (chip)', c.fac.success, c.fac.successSoft],
  ['fac.warning on fac.warningSoft (chip)', c.fac.warning, c.fac.warningSoft],
  ['fac.danger on fac.dangerSoft (chip)', c.fac.danger, c.fac.dangerSoft],
  ['fac.danger on fac.bg (error text)', c.fac.danger, c.fac.bg],
  ['fac.ink on fac.muted (segment)', c.fac.ink, c.fac.muted],
  ['child.ink on child.bg', c.child.ink, c.child.bg],
  ['child.ink on child.surface', c.child.ink, c.child.surface],
  ['child.ink on child.band', c.child.ink, c.child.band],
  ['child.ink on child.selectedSoft over child.bg', c.child.ink, compositeOver(c.child.bg, c.child.selectedSoft)],
  ['adult.chipInk on adult.chipBg', c.adult.chipInk, c.adult.chipBg],
];

describe('contrast of text/background token pairs (Light)', () => {
  it.each(PAIRS)('%s is at least 4.5:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('the helper is correct for black on white', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });
});
