// Public API of the board feature. Other features import ONLY from here.
export { ClassTint, type ClassTintProps, type WordClass } from './ui/ClassTint';
export { CoreKey, type CoreKeyKind, type CoreKeyProps } from './ui/CoreKey';
export { CoreKeyRow, type CoreKeyRowItem, type CoreKeyRowProps, type Hand } from './ui/CoreKeyRow';
export { SymbolCell, type SymbolCellProps, type SymbolCellState } from './ui/SymbolCell';
export { SymbolGrid, type GridCell, type SymbolGridProps } from './ui/SymbolGrid';
export { BoardScreen, type BoardScreenProps } from './ui/BoardScreen';
export { computeGrid, type GridResult } from './domain/gridLayout';
export { gateStateMachine, GATE_AREA, GATE_HOLD_MS } from './domain/gateStateMachine';
