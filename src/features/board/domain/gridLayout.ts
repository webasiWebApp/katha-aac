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
/** Shortest screen side below this is a phone. */
export const PHONE_BREAKPOINT = 600;

export type BoardLayoutMode = 'regular' | 'phonePortrait' | 'phoneLandscape';

export interface BoardMetrics {
  margin: number;
  zoneGap: number;
  cellGap: number | null;
  /** Message bar min height; buttons use `button` height (null = regular sizes). */
  bar: number;
  button: number | null;
  coreKey: number | null;
  coreRows: 1 | 2;
  messageBlock: number;
  coreBlock: number;
}

const METRICS: Record<BoardLayoutMode, BoardMetrics> = {
  regular: { margin: MARGIN, zoneGap: ZONE_GAP, cellGap: null, bar: 96, button: null, coreKey: null, coreRows: 1, messageBlock: MESSAGE_ROW, coreBlock: CORE_ROW },
  // bar 72 + 8 + buttons 64; core keys 2 rows x 64 + 8
  phonePortrait: { margin: 12, zoneGap: 8, cellGap: 8, bar: 72, button: 64, coreKey: 64, coreRows: 2, messageBlock: 144, coreBlock: 136 },
  // bar and buttons share one 56 row; one row of 48 core keys
  phoneLandscape: { margin: 8, zoneGap: 8, cellGap: 8, bar: 56, button: 56, coreKey: 48, coreRows: 1, messageBlock: 56, coreBlock: 48 },
};

export function layoutMode(width: number, height: number): BoardLayoutMode {
  if (Math.min(width, height) >= PHONE_BREAKPOINT) return 'regular';
  return width > height ? 'phoneLandscape' : 'phonePortrait';
}

export function boardMetrics(mode: BoardLayoutMode): BoardMetrics {
  return METRICS[mode];
}

/** Width/height are the usable screen size in dp (safe areas removed). Implements section 5.5. */
export function computeGrid(args: {
  width: number;
  height: number;
  gridSize: GridSize;
  mode?: BoardLayoutMode;
}): GridResult {
  const m = METRICS[args.mode ?? 'regular'];
  const areaW = args.width - 2 * m.margin;
  const areaH = args.height - 2 * m.margin - m.messageBlock - m.coreBlock - 2 * m.zoneGap;
  let size = args.gridSize;
  for (;;) {
    const d = { ...DIMS[size], gap: m.cellGap ?? DIMS[size].gap };
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
