// Test-only helpers (not exported from the theme barrel, so they never reach the app bundle).
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { ColorMode } from './colors';
import { ThemeProvider } from './ThemeProvider';

export interface ThemedOptions extends RenderOptions {
  mode?: ColorMode;
  reducedMotion?: boolean;
}

export function renderThemed(
  ui: ReactElement,
  { mode, reducedMotion, ...options }: ThemedOptions = {},
) {
  return render(
    <ThemeProvider mode={mode} reducedMotion={reducedMotion}>
      {ui}
    </ThemeProvider>,
    options,
  );
}

interface HostLike {
  props: {
    style?: StyleProp<ViewStyle>;
    hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
  };
  children: unknown[];
}

function isHost(node: unknown): node is HostLike {
  return typeof node === 'object' && node !== null && 'props' in node && 'children' in node;
}

/** First numeric value of `width`/`height` (or `minWidth`/`minHeight`) in the node or its descendants. */
function dimension(node: unknown, axis: 'width' | 'height'): number | undefined {
  if (!isHost(node)) return undefined;
  const flat = (StyleSheet.flatten(node.props.style) ?? {}) as Record<string, unknown>;
  const own = flat[axis] ?? flat[axis === 'width' ? 'minWidth' : 'minHeight'];
  if (typeof own === 'number') return own;
  for (const child of node.children) {
    const found = dimension(child, axis);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * Rendered touch size in dp of an element. Each axis comes from the element's own style or the
 * first descendant that declares it (Pressable render-prop children carry the size). Flexible
 * axes report their declared minimum. hitSlop on the element is added, so a 40 dp segment with
 * 4 dp slop above and below counts as 48.
 */
export function touchSize(node: unknown): { width?: number; height?: number } {
  if (!isHost(node)) return {};
  const slop = node.props.hitSlop ?? {};
  const width = dimension(node, 'width');
  const height = dimension(node, 'height');
  return {
    width: width === undefined ? undefined : width + (slop.left ?? 0) + (slop.right ?? 0),
    height: height === undefined ? undefined : height + (slop.top ?? 0) + (slop.bottom ?? 0),
  };
}
