import { View } from 'react-native';

import { getNavLabel, getWordLabel, type NavKey, type WordKey } from '@/core/i18n';
import { AdultGate } from '@/features/access';
import { AdultDot } from '@/features/audio';
import { CoreKey, CoreKeyRow, type CoreKeyRowItem } from '@/features/board';
import {
  ChildButton,
  MessageBar,
  MessageChip,
  TemplateSlot,
  type ChildButtonKind,
  type ChildButtonState,
  type MessageBarSymbol,
  type SentencePart,
} from '@/features/composer';
import { IntentConfirmChip } from '@/features/observations';

import { ChildStage, GalleryPage, Labeled, Showcase } from '../GalleryLayout';
import { noop, sampleWords } from '../galleryData';

const chip = (id: string, key: WordKey, speaking = false): MessageBarSymbol => ({
  kind: 'chip',
  id,
  pictogram: sampleWords[key].pictogram,
  label: getWordLabel(key),
  speaking,
});
const slot = (state: 'empty' | 'filled'): MessageBarSymbol => ({
  kind: 'slot',
  id: 'slot',
  state,
  pictogram: 'water',
  label: state === 'filled' ? getWordLabel('water') : undefined,
  accessibilityLabel: 'Open slot',
});
const part = (text: string, tone?: SentencePart['tone']): SentencePart => ({ text, tone });
const w = getWordLabel;

const barCases: {
  caption: string;
  state: 'idle' | 'speaking' | 'audioFallback';
  symbols: MessageBarSymbol[];
  sentence: SentencePart[];
}[] = [
  { caption: 'State=Empty', state: 'idle', symbols: [], sentence: [] },
  { caption: 'State=One', state: 'idle', symbols: [chip('1', 'me')], sentence: [part(w('me'))] },
  {
    caption: 'State=Two',
    state: 'idle',
    symbols: [chip('1', 'me'), chip('2', 'want')],
    sentence: [part(`${w('me')} ${w('want')}`)],
  },
  {
    caption: 'State=Template open',
    state: 'idle',
    symbols: [chip('1', 'me'), slot('empty'), chip('2', 'want')],
    sentence: [part(`${w('me')} `), part('___', 'faint'), part(` ${w('want')}`)],
  },
  {
    caption: 'State=Template filled',
    state: 'idle',
    symbols: [chip('1', 'me'), slot('filled'), chip('2', 'want')],
    sentence: [part(`${w('me')} ${w('water')} ${w('want')}`)],
  },
  {
    caption: 'State=Four',
    state: 'idle',
    symbols: [chip('1', 'me'), chip('2', 'more'), chip('3', 'water'), chip('4', 'want')],
    sentence: [part(`${w('me')} ${w('more')} ${w('water')} ${w('want')}`)],
  },
  {
    caption: 'State=Speaking (word-by-word highlight, waveform)',
    state: 'speaking',
    symbols: [chip('1', 'me'), chip('2', 'water', true), chip('3', 'want')],
    sentence: [part(`${w('me')} `), part(w('water'), 'highlight'), part(` ${w('want')}`)],
  },
  {
    caption: 'State=Audio fallback (tiny adult-only dot, no error)',
    state: 'audioFallback',
    symbols: [chip('1', 'me'), chip('2', 'water'), chip('3', 'want')],
    sentence: [part(`${w('me')} ${w('water')} ${w('want')}`)],
  },
];

const key = (
  id: string,
  kind: 'core' | 'nav',
  label: string,
  pictogram: CoreKeyRowItem['pictogram'],
): CoreKeyRowItem => ({ id, kind, label, pictogram, onPress: noop });
const nav = (k: NavKey) => getNavLabel(k);

const keys: CoreKeyRowItem[] = [
  key('home', 'nav', nav('home'), 'home'),
  key('quick', 'nav', nav('quick'), 'quick'),
  key('help', 'core', w('help'), 'help'),
  key('more', 'core', w('more'), 'more'),
  key('stop', 'core', w('stop'), 'stop'),
  key('yes', 'core', w('yes'), 'yes'),
  key('no', 'core', w('no'), 'no'),
  key('break', 'nav', nav('break'), 'break'),
];

const buttonCases: { kind: ChildButtonKind; state: ChildButtonState }[] = [
  ...(['default', 'pressed', 'disabled'] as const).map((state) => ({
    kind: 'speak' as const,
    state,
  })),
  ...(['default', 'pressed', 'disabled'] as const).map((state) => ({
    kind: 'undo' as const,
    state,
  })),
  ...(['default', 'pressed', 'disabled', 'longPress'] as const).map((state) => ({
    kind: 'clear' as const,
    state,
  })),
];

export function ChildMessageScreen() {
  return (
    <GalleryPage>
      <Showcase title="MessageChip" node="5:105">
        <ChildStage>
          <Labeled caption="State=Default">
            <MessageChip pictogram="me" label={w('me')} />
          </Labeled>
          <Labeled caption="State=Speaking">
            <MessageChip state="speaking" pictogram="me" label={w('me')} />
          </Labeled>
        </ChildStage>
      </Showcase>

      <Showcase
        title="TemplateSlot"
        node="5:124"
        note="Empty = faint symbol hint, never a text instruction. Invalid is calm, no red."
      >
        <ChildStage>
          <Labeled caption="State=Empty hint">
            <TemplateSlot
              state="empty"
              pictogram="water"
              accessibilityLabel="Open slot"
              onPress={noop}
            />
          </Labeled>
          <Labeled caption="State=Filled">
            <TemplateSlot
              state="filled"
              pictogram="water"
              label={w('water')}
              accessibilityLabel="Open slot"
              onPress={noop}
            />
          </Labeled>
          <Labeled caption="State=Invalid">
            <TemplateSlot
              state="invalid"
              pictogram="water"
              accessibilityLabel="Open slot"
              onPress={noop}
            />
          </Labeled>
        </ChildStage>
      </Showcase>

      <Showcase
        title="MessageBar"
        node="5:434"
        wide
        note="868 dp wide in Figma. Toggle reduced motion on the index screen to hide the waveform."
      >
        <ChildStage>
          {barCases.map((c) => (
            <Labeled key={c.caption} caption={c.caption}>
              <View style={{ width: 868 }}>
                <MessageBar
                  symbols={c.symbols}
                  sentence={c.sentence}
                  state={c.state}
                  audioFallbackLabel="TTS voice used"
                  accessibilityLabel="Message"
                />
              </View>
            </Labeled>
          ))}
        </ChildStage>
      </Showcase>

      <Showcase
        title="ChildButton"
        node="5:486"
        wide
        note="Clear is long-press only: a tap does nothing. Long-press ring is approximated."
      >
        <ChildStage>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {buttonCases.map(({ kind, state }) => (
              <Labeled key={`${kind}-${state}`} caption={`Kind=${kind}, State=${state}`}>
                <ChildButton
                  kind={kind}
                  state={state}
                  label={kind === 'speak' ? nav('speak') : undefined}
                  accessibilityLabel={kind}
                  accessibilityHint={kind === 'clear' ? 'Hold to clear' : undefined}
                  onPress={noop}
                  onLongPress={noop}
                />
              </Labeled>
            ))}
          </View>
        </ChildStage>
      </Showcase>

      <Showcase
        title="CoreKey"
        node="5:520"
        note="Core = purple edge; Nav = neutral band with folder edge."
      >
        <ChildStage>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {(['core', 'nav'] as const).flatMap((kind) =>
              [false, true].map((pressed) => (
                <Labeled
                  key={`${kind}${pressed}`}
                  caption={`Kind=${kind}, State=${pressed ? 'pressed' : 'default'}`}
                >
                  <CoreKey
                    kind={kind}
                    pressed={pressed}
                    label={kind === 'core' ? w('help') : nav('home')}
                    pictogram={kind === 'core' ? 'help' : 'home'}
                    onPress={noop}
                  />
                </Labeled>
              )),
            )}
          </View>
        </ChildStage>
      </Showcase>

      <Showcase
        title="CoreKeyRow"
        node="5:702"
        wide
        note="Same keys, same order, same place on every page. Left-handed mirrors once."
      >
        <ChildStage>
          {(['right', 'left'] as const).map((hand) => (
            <Labeled key={hand} caption={`Hand=${hand}`}>
              <View style={{ width: 1232 }}>
                <CoreKeyRow keys={keys} hand={hand} />
              </View>
            </Labeled>
          ))}
        </ChildStage>
      </Showcase>

      <Showcase
        title="AdultGate"
        node="5:732"
        wide
        note="Adult-only. Placeholder English text for the gallery."
      >
        <ChildStage>
          <Labeled caption="Step=Hold (hold 3 s to fire)">
            <AdultGate
              step="hold"
              holdLabel="Hold 3 s"
              onHoldComplete={noop}
              accessibilityLabel="Adult gate"
            />
          </Labeled>
          <Labeled caption="Step=Check">
            <AdultGate
              step="check"
              overline="ADULT CHECK"
              title="Adult check"
              instruction="Press and hold both buttons together for 2 seconds."
              holdHereLabel="Hold here"
              orPinLabel="or PIN"
              footnote="Wrong or no answer returns to the grid silently."
              pinFilled={2}
              onHoldChange={noop}
            />
          </Labeled>
        </ChildStage>
      </Showcase>

      <Showcase
        title="IntentConfirmChip"
        node="5:762"
        note="Adult-facing, low-salience. Placeholder English text."
      >
        <ChildStage>
          {(['visible', 'dismissing'] as const).map((state) => (
            <Labeled key={state} caption={`State=${state}`}>
              <IntentConfirmChip
                state={state}
                question="Meant this?"
                meantLabel="Meant"
                notMeantLabel="Not meant"
                unsureLabel="Unsure"
                onMeant={noop}
                onNotMeant={noop}
                onUnsure={noop}
              />
            </Labeled>
          ))}
        </ChildStage>
      </Showcase>

      <Showcase title="AdultDot" node="5:763" note="10 dp, TTS used.">
        <ChildStage>
          <AdultDot accessibilityLabel="TTS voice used" />
        </ChildStage>
      </Showcase>
    </GalleryPage>
  );
}
