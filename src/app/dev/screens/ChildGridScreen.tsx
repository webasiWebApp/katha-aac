import type { ReactNode } from 'react';
import { View } from 'react-native';

import { getWordLabel } from '@/core/i18n';
import { ClassTint, SymbolCell, type SymbolCellState, type WordClass } from '@/features/board';
import { PredictionStrip, StripCell, type StripItem } from '@/features/recommendations';

import { ChildStage, GalleryPage, Labeled, Showcase } from '../GalleryLayout';
import { noop, sampleWords } from '../galleryData';

const classes: WordClass[] = ['people', 'action', 'describing', 'thing', 'core', 'folder'];
const states: SymbolCellState[] = ['default', 'pressed', 'selected', 'hidden', 'disabled', 'new'];

const strip = (linked: number, ...keys: (keyof typeof sampleWords)[]): StripItem[] =>
  keys.map((key, i) => ({
    id: key,
    label: getWordLabel(key),
    pictogram: sampleWords[key].pictogram,
    wordClass: sampleWords[key].wordClass,
    state: i === linked ? 'linked' : 'default',
    onPress: noop,
  }));

/** The strip is a full-width band (1232 dp on the tablet); give it that width in the gallery. */
const Band = ({ children }: { children: ReactNode }) => (
  <View style={{ width: 1232 }}>{children}</View>
);

export function ChildGridScreen() {
  const water = sampleWords.water;
  return (
    <GalleryPage>
      <Showcase title="ClassTint" node="4:13" note="6 px edge, never a full background (R3, R5).">
        {classes.map((c) => (
          <Labeled key={c} caption={c}>
            <ChildStage>
              <ClassTint wordClass={c} style={{ width: 160 }} />
            </ChildStage>
          </Labeled>
        ))}
      </Showcase>

      {(['L', 'M', 'S'] as const).map((size) => (
        <Showcase
          key={size}
          title={`SymbolCell · Size ${size}`}
          node="4:167"
          wide
          note={
            size === 'L'
              ? '3x4 grid, 296 x 136'
              : size === 'M'
                ? '4x5 grid, 236 x 102'
                : '5x6 grid, 195 x 79 (never under 72)'
          }
        >
          <ChildStage>
            {states.map((state) => (
              <Labeled key={state} caption={`State=${state}`}>
                <SymbolCell
                  size={size}
                  state={state}
                  label={getWordLabel('water')}
                  pictogram={water.pictogram}
                  wordClass={water.wordClass}
                  opensPage={state === 'default' && size !== 'L'}
                  newBadgeLabel="NEW"
                  onPress={noop}
                />
              </Labeled>
            ))}
          </ChildStage>
        </Showcase>
      ))}

      <Showcase
        title="StripCell"
        node="4:183"
        wide
        note="Copies the grid symbol, label and edge exactly."
      >
        <ChildStage>
          {(['default', 'linked'] as const).map((state) => (
            <Labeled key={state} caption={`State=${state}`}>
              <StripCell
                state={state}
                label={getWordLabel('water')}
                pictogram={water.pictogram}
                wordClass={water.wordClass}
                onPress={noop}
              />
            </Labeled>
          ))}
        </ChildStage>
      </Showcase>

      <Showcase
        title="PredictionStrip"
        node="4:254"
        wide
        note="Distinct lavender band, separate from the grid (R8)."
      >
        <ChildStage>
          <Labeled caption="State=4 items">
            <Band>
              <PredictionStrip
                mode="items"
                items={strip(-1, 'kiribath', 'milk', 'water', 'more')}
              />
            </Band>
          </Labeled>
          <Labeled caption="State=3 items (first one linked to its grid cell)">
            <Band>
              <PredictionStrip mode="items" items={strip(0, 'kiribath', 'milk', 'water')} />
            </Band>
          </Labeled>
          <Labeled caption="State=Learning (cold start, calm, no message)">
            <Band>
              <PredictionStrip mode="learning" />
            </Band>
          </Labeled>
          <Labeled caption="State=Calm band (A/B), hidden from screen readers">
            <Band>
              <PredictionStrip mode="calm" />
            </Band>
          </Labeled>
        </ChildStage>
      </Showcase>
    </GalleryPage>
  );
}
