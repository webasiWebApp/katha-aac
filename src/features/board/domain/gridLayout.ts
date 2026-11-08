import type { GridSize } from '@/core/types/common';

export interface GridResult {
  cols: number;
  rows: number;
  gap: number;
  cellW: number;
  cellH: number;
  labelPlacement: 'under' | 'right';
  effectiveGridSize: GridSize;
  fellBack: boolean;
}

const DIMS: Record<GridSize, { rows: number; cols: number; gap: number }> = {
  '3x4': { rows: 3, cols: 4, gap: 16 },
  '4x5': { rows: 4, cols: 5, gap: 12 },
  '5x6': { rows: 5, cols: 6, gap: 12 },
};
const ORDER: GridSize[] = ['5x6', '4x5', '3x4'];
const MARGIN = 24;
const MESSAGE_ROW = 96;
const CORE_ROW = 88;
const ZONE_GAP = 12;
const MIN_CELL = 72;

/** Width/height are the full screen size in dp. Implements section 5.5. */
export function computeGrid(args: {
  width: number;
  height: number;
  gridSize: GridSize;
}): GridResult {
  const areaW = args.width - 2 * MARGIN;
  const areaH = args.height - 2 * MARGIN - MESSAGE_ROW - CORE_ROW - 2 * ZONE_GAP;
  let size = args.gridSize;
  for (;;) {
    const d = DIMS[size];
    const cellW = Math.floor((areaW - (d.cols - 1) * d.gap) / d.cols);
    const cellH = Math.floor((areaH - (d.rows - 1) * d.gap) / d.rows);
    const idx = ORDER.indexOf(size);
    if ((cellW < MIN_CELL || cellH < MIN_CELL) && idx < ORDER.length - 1) {
      size = ORDER[idx + 1] as GridSize;
      continue;
    }
    return {
      cols: d.cols,
      rows: d.rows,
      gap: d.gap,
      cellW,
      cellH,
      labelPlacement: size === '5x6' ? 'right' : 'under',
      effectiveGridSize: size,
      fellBack: size !== args.gridSize,
    };
  }
}
