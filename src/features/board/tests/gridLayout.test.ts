import { computeGrid, layoutMode } from '../domain/gridLayout';

describe('computeGrid', () => {
  it.each([
    ['3x4', 296, 170, 4, 3],
    ['4x5', 236, 127, 5, 4],
    ['5x6', 195, 99, 6, 5],
  ] as const)('1280x800 %s', (gridSize, w, h, cols, rows) => {
    const g = computeGrid({ width: 1280, height: 800, gridSize });
    expect([g.cellW, g.cellH, g.cols, g.rows, g.fellBack]).toEqual([w, h, cols, rows, false]);
  });
  it('label placement', () => {
    expect(computeGrid({ width: 1280, height: 800, gridSize: '5x6' }).labelPlacement).toBe('right');
    expect(computeGrid({ width: 1280, height: 800, gridSize: '3x4' }).labelPlacement).toBe('under');
  });
  it('falls back on small screens', () => {
    const g = computeGrid({ width: 600, height: 400, gridSize: '5x6' });
    expect(g.fellBack).toBe(true);
    expect(g.effectiveGridSize).not.toBe('5x6');
  });
});

describe('phone layouts (iPhone 12 Pro)', () => {
  it('detects the layout mode', () => {
    expect(layoutMode(390, 844)).toBe('phonePortrait');
    expect(layoutMode(844, 390)).toBe('phoneLandscape');
    expect(layoutMode(1280, 800)).toBe('regular');
  });

  it('fits a 3x4 grid in portrait with cells of at least 72 dp', () => {
    const g = computeGrid({ width: 390, height: 844 - 47 - 34, gridSize: '3x4', mode: 'phonePortrait' });
    expect(g.effectiveGridSize).toBe('3x4');
    expect(g.cellW).toBeGreaterThanOrEqual(72);
    expect(g.cellH).toBeGreaterThanOrEqual(72);
  });

  it('falls back to 3x4 in portrait when 5x6 is asked for', () => {
    const g = computeGrid({ width: 390, height: 763, gridSize: '5x6', mode: 'phonePortrait' });
    expect(g.effectiveGridSize).toBe('3x4');
    expect(g.fellBack).toBe(true);
  });

  it('fits a 3x4 grid in landscape', () => {
    const g = computeGrid({ width: 844 - 94, height: 390 - 21, gridSize: '3x4', mode: 'phoneLandscape' });
    expect(g.cellW).toBeGreaterThanOrEqual(72);
    expect(g.cellH).toBeGreaterThanOrEqual(72);
  });
});
