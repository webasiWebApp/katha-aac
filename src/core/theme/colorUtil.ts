// Composites a translucent token (#RRGGBBAA) over an opaque colour. Used where Figma stacks two
// fills (for example child/surface + child/selected-soft) because React Native has one
// backgroundColor per view.

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseHex(hex: string): Rgba {
  const h = hex.replace('#', '');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0').toUpperCase();

/** Returns `overlay` painted over `base` as an opaque #RRGGBB colour. */
export function compositeOver(base: string, overlay: string): string {
  const b = parseHex(base);
  const o = parseHex(overlay);
  const mix = (bv: number, ov: number) => ov * o.a + bv * (1 - o.a);
  return `#${toHex(mix(b.r, o.r))}${toHex(mix(b.g, o.g))}${toHex(mix(b.b, o.b))}`;
}
