import { View } from 'react-native';

import { size } from '@/core/theme';

import { SymbolCell, type SymbolCellProps } from './SymbolCell';

export interface GridCell extends Omit<SymbolCellProps, 'size'> {
  id: string;
}

export interface SymbolGridProps {
  cells: readonly GridCell[];
  /** Number of columns. Default 4 (3×4 starter). */
  columns?: number;
}

/**
 * Symbol grid for the child board.  Lays out cells in a uniform column grid with the standard
 * cell gap (16 dp).  Cell size is chosen automatically: L for 4-col, M for 5-col, S for 6-col.
 * Hidden cells still occupy their slot so the layout stays stable.
 */
export function SymbolGrid({ cells, columns = 4 }: SymbolGridProps) {
  const cellSize = columns <= 4 ? 'L' : columns === 5 ? 'M' : 'S';
  const rows: GridCell[][] = [];
  for (let i = 0; i < cells.length; i += columns) {
    rows.push(cells.slice(i, i + columns));
  }

  return (
    <View style={{ gap: size.cellGap }}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', gap: size.cellGap }}>
          {row.map((cell) => (
            <SymbolCell key={cell.id} size={cellSize} {...cell} />
          ))}
        </View>
      ))}
    </View>
  );
}
