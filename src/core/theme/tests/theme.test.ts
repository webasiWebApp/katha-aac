import { colorTokens, type ColorTokenName } from '../tokens';
import { childText } from '../typography';

const MODES = ['light', 'dark', 'highContrast'] as const;
const TOKEN_NAMES = Object.keys(colorTokens) as ColorTokenName[];

const HEX_RE = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;
const RGBA_RE = /^rgba\(\d+,\d+,\d+,[\d.]+\)$/;

function isValidColorString(s: string): boolean {
  return HEX_RE.test(s) || RGBA_RE.test(s);
}

/** Parse '#RRGGBB@0.nn' → 'rgba(r,g,b,a)'. Plain hex passes through. */
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

describe('colorTokens', () => {
  test('has exactly 46 tokens', () => {
    expect(TOKEN_NAMES).toHaveLength(46);
  });

  test.each(TOKEN_NAMES)('token "%s" has valid values for all 3 modes', (name) => {
    const triple = colorTokens[name];
    expect(triple).toHaveLength(3);
    ([triple[0], triple[1], triple[2]] as string[]).forEach((raw) => {
      const resolved = parseColorToken(raw);
      expect(isValidColorString(resolved)).toBe(true);
    });
  });
});

describe('text style tokens', () => {
  test('Child/Message lineHeight equals 48', () => {
    expect(childText.message.lineHeight).toBe(48); // 32 * 1.5
  });

  test('all child text styles have positive fontSize and lineHeight', () => {
    for (const [key, style] of Object.entries(childText)) {
      expect(style.fontSize).toBeGreaterThan(0);
      expect(style.lineHeight).toBeGreaterThan(0);
      expect(style.fontFamily).toBeTruthy();
      // lineHeight should be fontSize * 1.5 (all child styles use 1.5 ratio)
      expect(style.lineHeight).toBeCloseTo(style.fontSize * 1.5, 5);
      void key;
    }
  });
});
