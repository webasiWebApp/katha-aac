import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { getNavLabel, getWordLabel } from '@/core/i18n';
import { childGeometry, lightColors } from '@/core/theme';
import { renderThemed, touchSize } from '@/core/theme/testUtils';

import {
  ClassTint,
  CoreKey,
  CoreKeyRow,
  SymbolCell,
  type CoreKeyRowItem,
  type SymbolCellState,
  type WordClass,
} from '../index';

const classes: WordClass[] = ['people', 'action', 'describing', 'thing', 'core', 'folder'];
const states: SymbolCellState[] = ['default', 'pressed', 'selected', 'hidden', 'disabled', 'new'];
const sizes = ['L', 'M', 'S'] as const;
const water = getWordLabel('water');

describe('ClassTint', () => {
  it.each(classes)('draws a 6 dp edge in the %s colour', async (wordClass) => {
    await renderThemed(<ClassTint wordClass={wordClass} testID="tint" />);
    const style = StyleSheet.flatten(
      screen.getByTestId('tint', { includeHiddenElements: true }).props.style,
    );
    expect(style.height).toBe(6);
    expect(style.backgroundColor).toBe(lightColors.classTint[wordClass]);
  });
});

describe('SymbolCell', () => {
  it.each(sizes.flatMap((size) => states.map((state) => [size, state] as const)))(
    'size %s / state %s renders at the Figma cell size',
    async (size, state) => {
      const onPress = jest.fn();
      await renderThemed(
        <SymbolCell
          size={size}
          state={state}
          label={water}
          pictogram="water"
          wordClass="thing"
          opensPage={state === 'default'}
          newBadgeLabel="NEW"
          onPress={onPress}
        />,
      );

      if (state === 'hidden') {
        // Reserved but untaught cell (R1): present in layout, invisible to screen readers.
        expect(screen.queryByLabelText(water)).toBeNull();
        return;
      }

      const cell = screen.getByLabelText(water);
      expect(cell.props.accessibilityState).toMatchObject({
        disabled: state === 'disabled',
      });
      if (state === 'disabled') {
        // userEvent sends real touch events to the host view; fireEvent would find the parent's prop.
        await userEvent.setup().press(cell);
        expect(onPress).not.toHaveBeenCalled();
        return;
      }

      expect(cell.props.accessibilityRole).toBe('button');
      expect(cell.props.accessibilityState).toMatchObject({ selected: state === 'selected' });
      const dims = childGeometry.cell[size];
      const sized = touchSize(cell);
      expect(sized).toEqual({ width: dims.width, height: dims.height });
      // Child targets are at least 72 dp, and at least 120 dp on the 3x4 grid.
      expect(sized.width).toBeGreaterThanOrEqual(72);
      expect(sized.height).toBeGreaterThanOrEqual(size === 'L' ? 120 : 72);
      await fireEvent.press(cell);
      expect(onPress).toHaveBeenCalledTimes(1);
      if (state === 'new') expect(screen.getByText('NEW')).toBeTruthy();
    },
  );

  it('shows the word-class colour only as a thin edge, never as the cell fill', async () => {
    await renderThemed(
      <SymbolCell
        size="L"
        label={water}
        pictogram="water"
        wordClass="thing"
        onPress={() => undefined}
      />,
    );
    const edge = StyleSheet.flatten(
      screen.getByTestId('class-tint', { includeHiddenElements: true }).props.style,
    );
    expect(edge.height).toBe(6);
    expect(edge.backgroundColor).toBe(lightColors.classTint.thing);
  });

  it('never truncates the Sinhala label', async () => {
    await renderThemed(
      <SymbolCell
        size="S"
        label={getWordLabel('sleep')}
        pictogram="sleep"
        wordClass="action"
        onPress={() => undefined}
      />,
    );
    expect(screen.getByText(getWordLabel('sleep')).props.numberOfLines).toBeUndefined();
  });
});

describe('CoreKey', () => {
  it.each([
    ['core', false],
    ['core', true],
    ['nav', false],
    ['nav', true],
  ] as const)('kind %s, pressed %s is a 143 x 88 button', async (kind, pressed) => {
    const onPress = jest.fn();
    await renderThemed(
      <CoreKey
        kind={kind}
        pressed={pressed}
        label={getWordLabel('help')}
        pictogram="help"
        onPress={onPress}
      />,
    );
    const key = screen.getByRole('button', { name: getWordLabel('help') });
    expect(touchSize(key)).toEqual({ width: 143, height: 88 });
    const edge = StyleSheet.flatten(
      screen.getByTestId('class-tint', { includeHiddenElements: true }).props.style,
    );
    expect(edge.backgroundColor).toBe(
      kind === 'core' ? lightColors.classTint.core : lightColors.classTint.folder,
    );
    await fireEvent.press(key);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('CoreKeyRow', () => {
  const make = (id: string, kind: 'core' | 'nav', label: string): CoreKeyRowItem => ({
    id,
    kind,
    label,
    pictogram: 'help',
    onPress: () => undefined,
  });
  const keys = [
    make('home', 'nav', getNavLabel('home')),
    make('quick', 'nav', getNavLabel('quick')),
    make('help', 'core', getWordLabel('help')),
    make('more', 'core', getWordLabel('more')),
    make('stop', 'core', getWordLabel('stop')),
    make('yes', 'core', getWordLabel('yes')),
    make('no', 'core', getWordLabel('no')),
    make('break', 'nav', getNavLabel('break')),
  ];
  const order = () =>
    screen.getAllByRole('button').map((b) => b.props.accessibilityLabel as string);

  it('right-handed order is Home, Quick, help, more, stop, yes, no, Break', async () => {
    await renderThemed(<CoreKeyRow keys={keys} hand="right" />);
    expect(order()).toEqual(keys.map((k) => k.label));
  });

  it('left-handed layout mirrors the row once', async () => {
    await renderThemed(<CoreKeyRow keys={keys} hand="left" />);
    expect(order()).toEqual([...keys].reverse().map((k) => k.label));
  });

  it('keeps the same keys in the same place on every render (R2)', async () => {
    const first = await renderThemed(<CoreKeyRow keys={keys} />);
    const a = order();
    first.unmount();
    await renderThemed(<CoreKeyRow keys={keys} />);
    expect(order()).toEqual(a);
  });
});
