import { computeGrid } from '../domain/gridLayout';

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
