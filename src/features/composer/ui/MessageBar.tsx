import { Text, View, type ViewStyle } from 'react-native';

import { childText, useTheme } from '@/core/theme';
import { Icon } from '@/core/ui';
import { AdultDot } from '@/features/audio';
import type { PictogramName } from '@/features/vocabulary';

import { MessageChip } from './MessageChip';
import { TemplateSlot, type TemplateSlotState } from './TemplateSlot';

export type MessageBarSymbol =
  | { kind: 'chip'; id: string; pictogram: PictogramName; label: string; speaking?: boolean }
  | {
      kind: 'slot';
      id: string;
      state: TemplateSlotState;
      pictogram: PictogramName;
      label?: string;
      accessibilityLabel: string;
      onPress?: () => void;
    };

/** One run of the written sentence. `highlight` = word being spoken; `faint` = open blank "___". */
export interface SentencePart {
  text: string;
  tone?: 'normal' | 'highlight' | 'faint';
}

export type MessageBarState = 'idle' | 'speaking' | 'audioFallback';

export interface MessageBarProps {
  symbols: readonly MessageBarSymbol[];
  /** Written Sinhala sentence (32 sp), right of the divider (R7). verify with SLT */
  sentence: readonly SentencePart[];
  state?: MessageBarState;
  /** Adult-only text for the TTS dot on state="audioFallback", for example "TTS voice used". */
  audioFallbackLabel?: string;
  accessibilityLabel: string;
  /** Phone: minimum height in dp (default 96). */
  minHeight?: number;
}

const PAD = { l: 10, r: 20, t: 6, b: 6 };

/**
 * Message bar (Figma 5:434, 8 states): symbols with written words on the left, the Sinhala
 * sentence on the right. Speaking shows a 3 dp blue border and a waveform; both the highlight
 * and the waveform are hidden in reduced-motion mode (C-19). It never truncates the sentence:
 * the bar grows taller instead of clipping.
 */
export function MessageBar({
  symbols,
  sentence,
  state = 'idle',
  audioFallbackLabel,
  accessibilityLabel,
  minHeight = 96,
}: MessageBarProps) {
  const { colors, reducedMotion } = useTheme();
  const speaking = state === 'speaking';
  const bw = speaking ? 3 : 2;

  const container: ViewStyle = {
    minHeight,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    borderWidth: bw,
    borderColor: speaking ? colors.child.selected : colors.child.cellBorder,
    borderStyle: state === 'audioFallback' ? 'dashed' : 'solid',
    backgroundColor: colors.child.messageBg,
    paddingLeft: PAD.l - bw,
    paddingRight: PAD.r - bw,
    paddingTop: PAD.t - bw,
    paddingBottom: PAD.b - bw,
  };

  const toneColor = (tone: SentencePart['tone']) =>
    tone === 'faint'
      ? colors.child.inkFaint
      : tone === 'highlight' && !reducedMotion
        ? colors.child.selected
        : colors.child.ink;

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={container}
    >
      {symbols.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {symbols.map((symbol) =>
              symbol.kind === 'chip' ? (
                <MessageChip
                  key={symbol.id}
                  state={symbol.speaking && !reducedMotion ? 'speaking' : 'default'}
                  pictogram={symbol.pictogram}
                  label={symbol.label}
                />
              ) : (
                <TemplateSlot
                  key={symbol.id}
                  state={symbol.state}
                  pictogram={symbol.pictogram}
                  label={symbol.label}
                  accessibilityLabel={symbol.accessibilityLabel}
                  onPress={symbol.onPress}
                />
              ),
            )}
          </View>
          <View style={{ width: 2, height: 56, backgroundColor: colors.child.cellBorder }} />
        </>
      ) : null}
      <Text style={[childText.message, { flex: 1, color: colors.child.ink }]}>
        {sentence.map((part, i) => (
          <Text key={i} style={{ color: toneColor(part.tone) }}>
            {part.text}
          </Text>
        ))}
      </Text>
      {speaking && !reducedMotion ? (
        <View testID="message-waveform">
          <Icon name="wave" size={36} color={colors.child.selected} />
        </View>
      ) : null}
      {state === 'audioFallback' ? (
        <AdultDot
          accessibilityLabel={audioFallbackLabel}
          style={{ position: 'absolute', top: 10 - bw, right: 10 - bw }}
        />
      ) : null}
    </View>
  );
}
