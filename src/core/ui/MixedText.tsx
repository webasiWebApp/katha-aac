import { StyleSheet, Text, type TextStyle } from 'react-native';

import { fontFamily } from '@/core/theme';

// Sinhala Unicode block U+0D80–U+0DFF plus ZWJ U+200D (used in Sinhala conjuncts).
const SINHALA_RE = /[඀-෿‍]+/g;

export interface MixedTextProps {
  text: string;
  style?: TextStyle | TextStyle[];
  color?: string;
  /** Caps Dynamic Type scaling. Default matches the spec (1.3×). */
  maxFontSizeMultiplier?: number;
}

interface Run {
  text: string;
  isSinhala: boolean;
}

function splitMixed(text: string): Run[] {
  const runs: Run[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  SINHALA_RE.lastIndex = 0;
  while ((match = SINHALA_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index), isSinhala: false });
    }
    runs.push({ text: match[0], isSinhala: true });
    lastIndex = SINHALA_RE.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), isSinhala: false });
  }
  return runs;
}

/**
 * Maps a Latin Noto Sans font-family name to the weight-equivalent Sinhala family.
 * Called at render time; no StyleSheet.flatten needed (just match on the string).
 */
function sinhalaFamily(latinFamily?: string): string {
  if (!latinFamily) return fontFamily.sinhalaRegular;
  if (latinFamily.includes('700') || (latinFamily.includes('Bold') && !latinFamily.includes('Semi'))) {
    return fontFamily.sinhalaBold;
  }
  if (latinFamily.includes('600') || latinFamily.includes('SemiBold')) {
    return fontFamily.sinhalaSemiBold;
  }
  if (latinFamily.includes('500') || latinFamily.includes('Medium')) {
    return fontFamily.sinhalaMedium;
  }
  return fontFamily.sinhalaRegular;
}

/**
 * Renders a string that may contain both Latin and Sinhala characters.
 * Sinhala runs (U+0D80–U+0DFF, U+200D) receive the Noto Sans Sinhala family
 * at the same size and weight as the surrounding Latin text.
 * Set maxFontSizeMultiplier={1.3} on all adult text per the mixed-text rule.
 */
export function MixedText({ text, style, color, maxFontSizeMultiplier = 1.3 }: MixedTextProps) {
  const flat = StyleSheet.flatten(style);
  const sf = sinhalaFamily(flat?.fontFamily);
  const parts = splitMixed(text);

  return (
    <Text
      style={[style, color ? { color } : undefined]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
    >
      {parts.map((part, i) =>
        part.isSinhala ? (
          <Text key={i} style={{ fontFamily: sf }}>
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
}
