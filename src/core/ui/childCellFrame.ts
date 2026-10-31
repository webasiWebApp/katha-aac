import type { ViewStyle } from 'react-native';

import { compositeOver, pressedGlow, type ColorTokens } from '@/core/theme';

/** Visual states shared by every child-view cell (SymbolCell, StripCell, CoreKey, ...). */
export type CellFrameState = 'default' | 'pressed' | 'selected' | 'hidden' | 'disabled';

interface CellFrameOptions {
  state: CellFrameState;
  radius: number;
  /** Fill used when the cell is not pressed or hidden. Defaults to child/surface. */
  surface?: string;
}

/**
 * Frame (fill, border, glow) for a child cell, from the Figma SymbolCell variants:
 *   default  : child/surface fill, 2 px child/cell-border (inside)
 *   pressed  : + child/selected-soft overlay, 4 px child/selected border, Child/Pressed glow
 *   selected : 4 px child/selected border + Child/Pressed glow (no overlay)
 *   hidden   : child/placeholder fill, dashed 2 px child/cell-border (reserved cell, R1)
 *   disabled : same frame as default; the caller dims the content to 30 %
 * Figma strokes are inside the box, like a React Native border, so sizes match.
 */
export function cellFrameStyle(
  colors: ColorTokens,
  { state, radius, surface }: CellFrameOptions,
): ViewStyle {
  const base = surface ?? colors.child.surface;
  switch (state) {
    case 'pressed':
      return {
        borderRadius: radius,
        borderWidth: 4,
        borderColor: colors.child.selected,
        backgroundColor: compositeOver(base, colors.child.selectedSoft),
        ...pressedGlow,
      };
    case 'selected':
      return {
        borderRadius: radius,
        borderWidth: 4,
        borderColor: colors.child.selected,
        backgroundColor: base,
        ...pressedGlow,
      };
    case 'hidden':
      return {
        borderRadius: radius,
        borderWidth: 2,
        borderColor: colors.child.cellBorder,
        borderStyle: 'dashed',
        backgroundColor: colors.child.placeholder,
      };
    default:
      return {
        borderRadius: radius,
        borderWidth: 2,
        borderColor: colors.child.cellBorder,
        backgroundColor: base,
      };
  }
}

/** Disabled cells dim their content (not the frame) to 30 %, per the Figma Disabled variants. */
export const DISABLED_CONTENT_OPACITY = 0.3;
