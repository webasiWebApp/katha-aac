import { fireEvent, screen } from '@testing-library/react-native';

import { getWordLabel } from '@/core/i18n';
import { renderThemed, touchSize } from '@/core/theme/testUtils';

import { PredictionStrip, StripCell, type StripItem } from '../index';

const item = (id: string, word: Parameters<typeof getWordLabel>[0], linked = false): StripItem => ({
  id,
  label: getWordLabel(word),
  pictogram:
    word === 'kiribath'
      ? 'kiribath'
      : word === 'milk'
        ? 'milk'
        : word === 'water'
          ? 'water'
          : 'more',
  wordClass: word === 'more' ? 'core' : 'thing',
  state: linked ? 'linked' : 'default',
  onPress: jest.fn(),
});

describe('StripCell', () => {
  it.each(['default', 'linked'] as const)('state %s is a 216 x 72 button', async (state) => {
    const onPress = jest.fn();
    await renderThemed(
      <StripCell
        state={state}
        label={getWordLabel('water')}
        pictogram="water"
        wordClass="thing"
        onPress={onPress}
      />,
    );
    const cell = screen.getByRole('button', { name: getWordLabel('water') });
    expect(touchSize(cell)).toEqual({ width: 216, height: 72 });
    expect(cell.props.accessibilityState).toMatchObject({ selected: state === 'linked' });
    await fireEvent.press(cell);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('PredictionStrip', () => {
  it('4 items shows four tappable strip cells', async () => {
    await renderThemed(
      <PredictionStrip
        mode="items"
        items={[item('a', 'kiribath'), item('b', 'milk'), item('c', 'water'), item('d', 'more')]}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('3 items shows three strip cells and marks the linked one', async () => {
    await renderThemed(
      <PredictionStrip
        mode="items"
        items={[item('a', 'kiribath', true), item('b', 'milk'), item('c', 'water')]}
      />,
    );
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(3);
    expect(cells[0]?.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('learning (cold start) is empty and calm, with no message for the child', async () => {
    await renderThemed(<PredictionStrip mode="learning" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.toJSON()).toBeTruthy();
  });

  it('calm band (conditions A and B) is hidden from screen readers', async () => {
    await renderThemed(<PredictionStrip mode="calm" />);
    const band = screen.toJSON() as unknown as {
      props: { accessibilityElementsHidden?: boolean; style: { height: number } };
    };
    expect(band.props.accessibilityElementsHidden).toBe(true);
    expect(band.props.style.height).toBe(88);
  });
});
