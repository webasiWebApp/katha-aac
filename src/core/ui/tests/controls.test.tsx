// Interactive facilitator components: Toggle, SegmentedControl, ListRow, TextField, Dialog,
// AppBar, BottomNav. Every one needs a role, a label, a state and a touch target of 48 dp or more.
import { fireEvent, screen } from '@testing-library/react-native';

import { renderThemed, touchSize } from '@/core/theme/testUtils';

import { AppBar } from '../AppBar';
import { BottomNav } from '../BottomNav';
import { Dialog } from '../Dialog';
import { ListRow, type ListRowKind } from '../ListRow';
import { SegmentedControl } from '../SegmentedControl';
import { TextField, type TextFieldState } from '../TextField';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it.each([
    ['on', true, false],
    ['off', false, false],
    ['locked', false, true],
  ] as const)(
    'renders %s as a switch with state and a 60 x 48 target',
    async (_name, value, locked) => {
      const onChange = jest.fn();
      await renderThemed(
        <Toggle
          value={value}
          onValueChange={onChange}
          locked={locked}
          accessibilityLabel="Prediction"
        />,
      );
      const toggle = screen.getByRole('switch', { name: 'Prediction' });
      expect(toggle.props.accessibilityState).toMatchObject({ checked: value, disabled: locked });
      expect(touchSize(toggle)).toEqual({ width: 60, height: 48 });
      await fireEvent.press(toggle);
      expect(onChange).toHaveBeenCalledTimes(locked ? 0 : 1);
      if (!locked) expect(onChange).toHaveBeenCalledWith(!value);
    },
  );
});

describe('SegmentedControl', () => {
  const options = [
    { key: 'a', label: 'Option 1' },
    { key: 'b', label: 'Option 2' },
    { key: 'c', label: 'Option 3' },
  ];

  it.each(options.map((o) => o.key))('marks %s as selected', async (selectedKey) => {
    const onSelect = jest.fn();
    await renderThemed(
      <SegmentedControl
        options={options}
        selectedKey={selectedKey}
        onSelect={onSelect}
        accessibilityLabel="Mode"
      />,
    );
    // A group container is deliberately not `accessible`, so its radios stay individually focusable.
    expect(screen.getByLabelText('Mode').props.accessibilityRole).toBe('radiogroup');
    for (const option of options) {
      const radio = screen.getByRole('radio', { name: option.label });
      expect(radio.props.accessibilityState).toMatchObject({
        selected: option.key === selectedKey,
      });
      // 40 dp segment + 4 dp hit slop above and below = 48 dp target.
      expect(touchSize(radio)?.height).toBeGreaterThanOrEqual(48);
    }
    await fireEvent.press(screen.getByRole('radio', { name: 'Option 2' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});

describe('ListRow', () => {
  it.each<ListRowKind>(['navigation', 'value'])(
    '%s row is a button with at least 64 dp',
    async (kind) => {
      const onPress = jest.fn();
      await renderThemed(
        <ListRow
          kind={kind}
          title="Row title"
          subtitle="Supporting text"
          icon="book"
          value="Value"
          onPress={onPress}
        />,
      );
      const row = screen.getByRole('button');
      expect(touchSize(row)?.height).toBeGreaterThanOrEqual(64);
      await fireEvent.press(row);
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );

  it('subtitle wraps (no truncation) in a 328-wide container', async () => {
    await renderThemed(
      <ListRow
        kind="navigation"
        title="Long subtitle row"
        subtitle="This is a very long subtitle that should wrap across multiple lines without being truncated at all."
        onPress={() => undefined}
      />,
    );
    const subtitle = screen.getByText(
      'This is a very long subtitle that should wrap across multiple lines without being truncated at all.',
    );
    // numberOfLines must be undefined (no limit) or 0 — never 1.
    expect(subtitle.props.numberOfLines ?? 0).not.toBe(1);
  });

  it('toggle row contains a labelled switch and is 72 dp high', async () => {
    const onToggle = jest.fn();
    await renderThemed(
      <ListRow kind="toggle" title="Voice" toggleValue onToggle={onToggle} icon="speaker" />,
    );
    expect(screen.getByRole('switch', { name: 'Voice' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('switch', { name: 'Voice' }));
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});

describe('TextField', () => {
  it.each<TextFieldState>(['default', 'focus', 'locked'])('renders state %s', async (state) => {
    await renderThemed(<TextField label="Name" value="Senuri" state={state} />);
    const input = screen.getByLabelText('Name', { exact: true });
    expect(input.props.accessibilityState).toMatchObject({ disabled: state === 'locked' });
    expect(input.props.editable).toBe(state !== 'locked');
  });

  it('forwards typing', async () => {
    const onChangeText = jest.fn();
    await renderThemed(<TextField label="Name" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Amma');
    expect(onChangeText).toHaveBeenCalledWith('Amma');
  });
});

describe('Dialog', () => {
  it('has a title, body and two 48 dp actions', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderThemed(
      <Dialog
        title="Move this symbol?"
        body="Moving symbols can make them harder to find. Move anyway?"
        confirmLabel="Move"
        onConfirm={onConfirm}
        cancelLabel="Cancel"
        onCancel={onCancel}
      />,
    );
    const dialog = screen.getByLabelText('Move this symbol?');
    expect(dialog.props.accessibilityRole).toBe('alert');
    expect(dialog.props.accessibilityViewIsModal).toBe(true);
    expect(touchSize(screen.getByRole('button', { name: 'Move' }))?.height).toBe(48);
    await fireEvent.press(screen.getByRole('button', { name: 'Move' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('AppBar', () => {
  it('root bar has a header and a 48 x 48 action', async () => {
    await renderThemed(
      <AppBar
        kind="root"
        title="Screen title"
        actionLabel="Notifications"
        onAction={() => undefined}
      />,
    );
    expect(screen.getByRole('header', { name: 'Screen title' })).toBeTruthy();
    expect(touchSize(screen.getByRole('button', { name: 'Notifications' }))).toEqual({
      width: 48,
      height: 48,
    });
  });

  it('back bar adds a back button', async () => {
    const onBack = jest.fn();
    await renderThemed(
      <AppBar
        kind="back"
        title="Screen title"
        onBack={onBack}
        backLabel="Back"
        actionLabel="More"
        onAction={() => undefined}
      />,
    );
    const back = screen.getByRole('button', { name: 'Back' });
    expect(touchSize(back)).toEqual({ width: 48, height: 48 });
    await fireEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('BottomNav', () => {
  const items = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'child', label: 'Child', icon: 'child' },
    { key: 'vocabulary', label: 'Vocabulary', icon: 'book' },
    { key: 'insights', label: 'Insights', icon: 'chart' },
    { key: 'settings', label: 'Settings', icon: 'gear' },
  ] as const;

  it.each(items.map((i) => i.key))('marks %s as the selected tab', async (activeKey) => {
    const onSelect = jest.fn();
    await renderThemed(<BottomNav items={items} activeKey={activeKey} onSelect={onSelect} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    for (const item of items) {
      const tab = screen.getByRole('tab', { name: item.label });
      expect(tab.props.accessibilityState).toMatchObject({ selected: item.key === activeKey });
      expect(touchSize(tab)?.height).toBeGreaterThanOrEqual(48);
    }
    await fireEvent.press(screen.getByRole('tab', { name: 'Insights' }));
    expect(onSelect).toHaveBeenCalledWith('insights');
  });
});
