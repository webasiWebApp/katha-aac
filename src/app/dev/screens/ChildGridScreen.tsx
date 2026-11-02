
import { getWordLabel } from '@/core/i18n';
import { ClassTint, SymbolCell, type SymbolCellState, type WordClass } from '@/features/board';

import { ChildStage, GalleryPage, Labeled, Showcase } from '../GalleryLayout';
import { noop, sampleWords } from '../galleryData';

const classes: WordClass[] = ['people', 'action', 'describing', 'thing', 'core', 'folder'];
const states: SymbolCellState[] = ['default', 'pressed', 'selected', 'hidden', 'disabled', 'new'];

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
    </GalleryPage>
  );
}
