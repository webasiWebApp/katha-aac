import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { getNavLabel, getWordLabel } from '@/core/i18n';
import { lightColors } from '@/core/theme';
import { renderThemed, touchSize } from '@/core/theme/testUtils';

import {
  ChildButton,
  MessageBar,
  MessageChip,
  TemplateSlot,
  type ChildButtonKind,
  type ChildButtonState,
  type MessageBarProps,
  type MessageBarState,
  type MessageBarSymbol,
  type SentencePart,
  type TemplateSlotState,
} from '../index';

const me = getWordLabel('me');
const water = getWordLabel('water');
const want = getWordLabel('want');
const more = getWordLabel('more');

describe('MessageChip', () => {
  it.each([
    ['default', 68, 84],
    ['speaking', 72, 88],
  ] as const)('state %s is %i x %i', async (state, width, height) => {
    await renderThemed(<MessageChip state={state} pictogram="me" label={me} />);
    const chip = screen.getByLabelText(me);
    expect(touchSize(chip)).toEqual({ width, height });
    expect(chip.props.accessibilityState).toMatchObject({ selected: state === 'speaking' });
  });
});

describe('TemplateSlot', () => {
  it.each<TemplateSlotState>(['empty', 'filled', 'invalid'])(
    'state %s is 96 x 84 and a button',
    async (state) => {
      const onPress = jest.fn();
      await renderThemed(
        <TemplateSlot
          state={state}
          pictogram="water"
          label={water}
          accessibilityLabel="Open slot"
          onPress={onPress}
        />,
      );
      const slot = screen.getByRole('button', { name: state === 'filled' ? water : 'Open slot' });
      expect(touchSize(slot)).toEqual({ width: 96, height: 84 });
      expect(slot.props.accessibilityState).toMatchObject({ selected: state === 'filled' });
      await fireEvent.press(slot);
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('never shows a text instruction in the empty state (R1, child view)', async () => {
    await renderThemed(
      <TemplateSlot state="empty" pictogram="water" label={water} accessibilityLabel="Open slot" />,
    );
    expect(screen.queryByText(water)).toBeNull();
  });
});

describe('MessageBar', () => {
  const chip = (id: string, label: string, speaking = false): MessageBarSymbol => ({
    kind: 'chip',
    id,
    pictogram: 'me',
    label,
    speaking,
  });
  const text = (...parts: SentencePart[]) => parts;

  const cases: {
    name: string;
    state: MessageBarState;
    symbols: MessageBarSymbol[];
    sentence: SentencePart[];
  }[] = [
    { name: 'Empty', state: 'idle', symbols: [], sentence: [] },
    { name: 'One', state: 'idle', symbols: [chip('1', me)], sentence: text({ text: me }) },
    {
      name: 'Two',
      state: 'idle',
      symbols: [chip('1', me), chip('2', want)],
      sentence: text({ text: `${me} ${want}` }),
    },
    {
      name: 'Template open',
      state: 'idle',
      symbols: [
        chip('1', me),
        {
          kind: 'slot',
          id: 's',
          state: 'empty',
          pictogram: 'water',
          accessibilityLabel: 'Open slot',
        },
        chip('2', want),
      ],
      sentence: text({ text: `${me} ` }, { text: '___', tone: 'faint' }, { text: ` ${want}` }),
    },
    {
      name: 'Template filled',
      state: 'idle',
      symbols: [
        chip('1', me),
        {
          kind: 'slot',
          id: 's',
          state: 'filled',
          pictogram: 'water',
          label: water,
          accessibilityLabel: 'Slot',
        },
        chip('2', want),
      ],
      sentence: text({ text: `${me} ${water} ${want}` }),
    },
    {
      name: 'Four',
      state: 'idle',
      symbols: [chip('1', me), chip('2', more), chip('3', water), chip('4', want)],
      sentence: text({ text: `${me} ${more} ${water} ${want}` }),
    },
    {
      name: 'Speaking',
      state: 'speaking',
      symbols: [chip('1', me), chip('2', water, true), chip('3', want)],
      sentence: text({ text: `${me} ` }, { text: water, tone: 'highlight' }, { text: ` ${want}` }),
    },
    {
      name: 'Audio fallback',
      state: 'audioFallback',
      symbols: [chip('1', me), chip('2', water), chip('3', want)],
      sentence: text({ text: `${me} ${water} ${want}` }),
    },
  ];

  const bar = (c: (typeof cases)[number], extra: Partial<MessageBarProps> = {}) => (
    <MessageBar
      symbols={c.symbols}
      sentence={c.sentence}
      state={c.state}
      audioFallbackLabel="TTS voice used"
      accessibilityLabel="Message"
      {...extra}
    />
  );

  it.each(cases)('state "$name" renders with a summary label and never truncates', async (c) => {
    await renderThemed(bar(c));
    const node = screen.getByLabelText('Message');
    expect(node.props.accessibilityRole).toBe('summary');
    expect(StyleSheet.flatten(node.props.style).minHeight).toBe(96);
    for (const part of c.sentence) {
      if (part.text.trim())
        expect(screen.getAllByText(part.text, { exact: false }).length).toBeGreaterThan(0);
    }
  });

  it('speaking shows the waveform and highlights the spoken word', async () => {
    const speaking = cases.find((c) => c.name === 'Speaking') as (typeof cases)[number];
    await renderThemed(bar(speaking));
    expect(screen.getByTestId('message-waveform')).toBeTruthy();
    const colorsOfWord = screen
      .getAllByText(water)
      .map((n) => StyleSheet.flatten(n.props.style).color);
    expect(colorsOfWord).toContain(lightColors.child.selected);
    expect(StyleSheet.flatten(screen.getByLabelText('Message').props.style).borderWidth).toBe(3);
  });

  it('reduced motion removes the waveform and the highlight (C-19)', async () => {
    const speaking = cases.find((c) => c.name === 'Speaking') as (typeof cases)[number];
    await renderThemed(bar(speaking), { reducedMotion: true });
    expect(screen.queryByTestId('message-waveform')).toBeNull();
    const colorsOfWord = screen
      .getAllByText(water)
      .map((n) => StyleSheet.flatten(n.props.style).color);
    expect(colorsOfWord).not.toContain(lightColors.child.selected);
  });

  it('audio fallback shows only a tiny adult-only dot, with no error text', async () => {
    const fallback = cases.find((c) => c.name === 'Audio fallback') as (typeof cases)[number];
    await renderThemed(bar(fallback));
    expect(screen.getByLabelText('TTS voice used')).toBeTruthy();
    expect(screen.queryByText(/error/i)).toBeNull();
  });
});

describe('ChildButton', () => {
  const kinds: ChildButtonKind[] = ['speak', 'undo', 'clear'];
  const states: ChildButtonState[] = ['default', 'pressed', 'disabled'];
  const label = (k: ChildButtonKind) => ({ speak: 'Speak', undo: 'Undo', clear: 'Clear' })[k];

  it.each(kinds.flatMap((k) => states.map((s) => [k, s] as const)))(
    '%s / %s has role, label, state and size',
    async (kind, state) => {
      await renderThemed(
        <ChildButton
          kind={kind}
          state={state}
          label={kind === 'speak' ? getNavLabel('speak') : undefined}
          accessibilityLabel={label(kind)}
          onPress={() => undefined}
          onLongPress={() => undefined}
        />,
      );
      const button = screen.getByRole('button', { name: label(kind) });
      expect(button.props.accessibilityState).toMatchObject({ disabled: state === 'disabled' });
      expect(touchSize(button)).toEqual({ width: kind === 'speak' ? 136 : 96, height: 96 });
    },
  );

  it('Clear in its long-press state still has the 96 x 96 target', async () => {
    await renderThemed(
      <ChildButton
        kind="clear"
        state="longPress"
        accessibilityLabel="Clear"
        onLongPress={() => undefined}
      />,
    );
    expect(touchSize(screen.getByRole('button', { name: 'Clear' }))).toEqual({
      width: 96,
      height: 96,
    });
  });

  it('Speak and Undo respond to a tap', async () => {
    const speak = jest.fn();
    const undo = jest.fn();
    await renderThemed(
      <>
        <ChildButton
          kind="speak"
          label={getNavLabel('speak')}
          accessibilityLabel="Speak"
          onPress={speak}
        />
        <ChildButton kind="undo" accessibilityLabel="Undo" onPress={undo} />
      </>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Speak' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Undo' }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('Clear ignores a plain tap and fires only on long-press', async () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    await renderThemed(
      <ChildButton
        kind="clear"
        accessibilityLabel="Clear"
        accessibilityHint="Hold to clear"
        onPress={onPress}
        onLongPress={onLongPress}
      />,
    );
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear.props.accessibilityHint).toBe('Hold to clear');
    const user = userEvent.setup();
    await user.press(clear);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
    await user.longPress(clear);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('a disabled button ignores presses', async () => {
    const onPress = jest.fn();
    await renderThemed(
      <ChildButton kind="speak" state="disabled" accessibilityLabel="Speak" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Speak' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
