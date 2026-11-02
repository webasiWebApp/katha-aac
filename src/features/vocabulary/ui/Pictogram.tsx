import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { logError } from '@/core/log';
import { childText, radius, useTheme } from '@/core/theme';

import { pictogramSvg } from './pictogramData';

export type PictogramName = keyof typeof pictogramSvg;

export const pictogramNames = Object.keys(pictogramSvg) as PictogramName[];

export interface PictogramProps {
  symbol: PictogramName;
  /** Drawn on a 96 px grid in Figma; cells use 72 (L), 48 (M, S, strips), 44 (core keys), 52-56 (buttons). */
  size?: number;
  /** Pictograms are decorative inside labelled cells. Set a label only if used alone. */
  accessibilityLabel?: string;
  /** Shown centred in the placeholder square when no SVG file exists for this symbol. */
  fallbackLabel?: string;
}

const _loggedFallbacks = new Set<string>();

/**
 * PLACEHOLDER pictogram (ARASAAC-style stand-in from Figma frame 3:230), not final artwork.
 * SVG markup is generated from assets/pictograms by scripts/gen-pictograms.js.
 * If no SVG exists for the symbol at runtime, renders a coloured square (5.7 fallback).
 */
export function Pictogram({ symbol, size = 96, accessibilityLabel, fallbackLabel }: PictogramProps) {
  const { colors } = useTheme();
  const labelled = accessibilityLabel !== undefined;
  const xml = pictogramSvg[symbol] as string | undefined;

  if (!xml) {
    if (!_loggedFallbacks.has(symbol)) {
      _loggedFallbacks.add(symbol);
      logError('vocabulary', 'missing_pictogram', new Error(`pictogram not found: ${symbol}`));
    }
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, backgroundColor: colors.child.placeholder },
        ]}
        accessible={labelled}
        accessibilityRole={labelled ? 'image' : undefined}
        accessibilityLabel={accessibilityLabel}
        importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
        testID="pictogram-fallback"
      >
        {fallbackLabel ? (
          <Text style={[childText.chip, { color: colors.child.ink }]} numberOfLines={3}>
            {fallbackLabel}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <SvgXml
      xml={xml}
      width={size}
      height={size}
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});
