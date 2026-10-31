import { useState } from 'react';
import { View } from 'react-native';

import {
  AppBar,
  BottomNav,
  Button,
  Card,
  Chip,
  Dialog,
  EmptyState,
  ListRow,
  OfflineBadge,
  ProgressBar,
  SegmentedControl,
  StatTile,
  TextField,
  Toast,
  Toggle,
  type BottomNavItem,
  type ButtonSize,
  type ButtonVariant,
  type ChipTone,
} from '@/core/ui';
import { ConsentBanner } from '@/features/access';
import { SuggestionCard, type SuggestionConfidence } from '@/features/insights';
import { PhaseTimeline } from '@/features/study-mode';

import { GalleryPage, Labeled, Showcase } from '../GalleryLayout';
import { noop } from '../galleryData';

const navItems: BottomNavItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'child', label: 'Child', icon: 'child' },
  { key: 'vocabulary', label: 'Vocabulary', icon: 'book' },
  { key: 'insights', label: 'Insights', icon: 'chart' },
  { key: 'settings', label: 'Settings', icon: 'gear' },
];
const segments = [
  { key: 'first', label: 'Option 1' },
  { key: 'second', label: 'Option 2' },
  { key: 'third', label: 'Option 3' },
];
const phases = [
  { key: 'baseline', label: 'Baseline' },
  { key: 'alternating', label: 'Alternating' },
  { key: 'probes', label: 'Probes' },
  { key: 'maintenance', label: 'Maintenance' },
];
const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const sizes: ButtonSize[] = ['L', 'M'];
const tones: ChipTone[] = ['neutral', 'primary', 'success', 'warning', 'danger'];
const confidences: SuggestionConfidence[] = ['high', 'medium', 'low'];

export function FacilitatorScreen() {
  const [toggle, setToggle] = useState(true);
  const [segment, setSegment] = useState('first');
  const [nav, setNav] = useState('home');
  const [rowToggle, setRowToggle] = useState(true);

  return (
    <GalleryPage>
      <Showcase
        title="Button"
        node="5:805"
        note="Disabled = 45 % opacity (as in SuggestionCard Held)."
      >
        {variants.flatMap((variant) =>
          sizes.map((size) => (
            <Labeled key={`${variant}${size}`} caption={`${variant} / ${size}`}>
              <Button label="Button" variant={variant} size={size} onPress={noop} />
            </Labeled>
          )),
        )}
        <Labeled caption="primary / M / disabled">
          <Button label="Button" disabled onPress={noop} />
        </Labeled>
        <Labeled caption="with icon">
          <Button label="Add" icon="plus" onPress={noop} />
        </Labeled>
      </Showcase>

      <Showcase title="Chip · OfflineBadge" node="5:818">
        {tones.map((tone) => (
          <Labeled key={tone} caption={`Tone=${tone}`}>
            <Chip label="Label" tone={tone} />
          </Labeled>
        ))}
        <Labeled caption="OfflineBadge">
          <OfflineBadge label="Works offline" />
        </Labeled>
      </Showcase>

      <Showcase title="AppBar" node="5:842" wide>
        <View style={{ width: 360 }}>
          <Labeled caption="Kind=Root">
            <View style={{ width: 360 }}>
              <AppBar
                kind="root"
                title="Screen title"
                actionLabel="Notifications"
                onAction={noop}
              />
            </View>
          </Labeled>
        </View>
        <View style={{ width: 360 }}>
          <Labeled caption="Kind=Back">
            <View style={{ width: 360 }}>
              <AppBar
                kind="back"
                title="Screen title"
                backLabel="Back"
                onBack={noop}
                actionLabel="More"
                onAction={noop}
              />
            </View>
          </Labeled>
        </View>
      </Showcase>

      <Showcase title="BottomNav" node="5:1021" wide>
        {navItems.map((item) => (
          <Labeled key={item.key} caption={`Active=${item.label}`}>
            <View style={{ width: 360 }}>
              <BottomNav items={navItems} activeKey={item.key} onSelect={noop} />
            </View>
          </Labeled>
        ))}
        <Labeled caption="Interactive">
          <View style={{ width: 360 }}>
            <BottomNav items={navItems} activeKey={nav} onSelect={setNav} />
          </View>
        </Labeled>
      </Showcase>

      <Showcase title="StatTile" node="5:1048">
        {(['up', 'down', 'flat'] as const).map((trend) => (
          <Labeled key={trend} caption={`Trend=${trend}`}>
            <View style={{ width: 156 }}>
              <StatTile label="Messages sent" value="42" trend={trend} delta="+8 vs last week" />
            </View>
          </Labeled>
        ))}
      </Showcase>

      <Showcase title="Toggle" node="5:1064" note="Locked = set by study protocol.">
        <Labeled caption="State=On (interactive)">
          <Toggle value={toggle} onValueChange={setToggle} accessibilityLabel="Prediction" />
        </Labeled>
        <Labeled caption="State=Off">
          <Toggle value={false} onValueChange={noop} accessibilityLabel="Prediction off" />
        </Labeled>
        <Labeled caption="State=Locked">
          <Toggle value locked onValueChange={noop} accessibilityLabel="Prediction locked" />
        </Labeled>
      </Showcase>

      <Showcase title="SegmentedControl" node="5:1086" wide>
        {segments.map((s) => (
          <Labeled key={s.key} caption={`Selected=${s.label}`}>
            <View style={{ width: 328 }}>
              <SegmentedControl
                options={segments}
                selectedKey={s.key}
                onSelect={noop}
                accessibilityLabel="Mode"
              />
            </View>
          </Labeled>
        ))}
        <Labeled caption="Interactive">
          <View style={{ width: 328 }}>
            <SegmentedControl
              options={segments}
              selectedKey={segment}
              onSelect={setSegment}
              accessibilityLabel="Mode"
            />
          </View>
        </Labeled>
      </Showcase>

      <Showcase title="ListRow" node="5:1122" wide>
        <Labeled caption="Kind=Navigation">
          <View style={{ width: 328 }}>
            <ListRow
              kind="navigation"
              title="Row title"
              subtitle="Supporting text"
              icon="book"
              onPress={noop}
            />
          </View>
        </Labeled>
        <Labeled caption="Kind=Toggle">
          <View style={{ width: 328 }}>
            <ListRow
              kind="toggle"
              title="Row title"
              subtitle="Supporting text"
              icon="book"
              toggleValue={rowToggle}
              onToggle={setRowToggle}
            />
          </View>
        </Labeled>
        <Labeled caption="Kind=Value">
          <View style={{ width: 328 }}>
            <ListRow
              kind="value"
              title="Row title"
              subtitle="Supporting text"
              icon="book"
              value="Value"
              onPress={noop}
            />
          </View>
        </Labeled>
      </Showcase>

      <Showcase title="TextField" node="5:1140" wide>
        {(['default', 'focus', 'locked'] as const).map((state) => (
          <Labeled key={state} caption={`State=${state}`}>
            <View style={{ width: 328 }}>
              <TextField label="Label" value="Value" state={state} onChangeText={noop} />
            </View>
          </Labeled>
        ))}
      </Showcase>

      <Showcase title="Dialog · Toast · EmptyState · ConsentBanner · Card" node="5:1144" wide>
        <Labeled caption="Dialog">
          <View style={{ width: 312 }}>
            <Dialog
              title="Move this symbol?"
              body="Moving symbols can make them harder to find. Move anyway?"
              confirmLabel="Move anyway"
              onConfirm={noop}
              cancelLabel="Cancel"
              onCancel={noop}
            />
          </View>
        </Labeled>
        <Labeled caption="Toast">
          <View style={{ width: 328 }}>
            <Toast message="Saved on this device" />
          </View>
        </Labeled>
        <Labeled caption="EmptyState">
          <View style={{ width: 328 }}>
            <EmptyState
              title="Not enough data yet"
              body="Insights appear after about 5 sessions."
            />
          </View>
        </Labeled>
        <Labeled caption="ConsentBanner">
          <View style={{ width: 328 }}>
            <ConsentBanner
              title="Data stays on this device"
              body="Research logging is optional and can be withdrawn at any time."
            />
          </View>
        </Labeled>
        <Labeled caption="Card">
          <View style={{ width: 328 }}>
            <Card title="Card title" body="Card body text in plain language." />
          </View>
        </Labeled>
      </Showcase>

      <Showcase title="PhaseTimeline" node="5:1282" wide>
        {phases.map((p) => (
          <Labeled key={p.key} caption={`Current=${p.label}`}>
            <View style={{ width: 328 }}>
              <PhaseTimeline
                phases={phases}
                currentKey={p.key}
                statusLabels={{ done: 'Completed', current: 'Current phase', upcoming: 'Upcoming' }}
              />
            </View>
          </Labeled>
        ))}
      </Showcase>

      <Showcase
        title="SuggestionCard"
        node="5:1512"
        wide
        note="Every card: evidence, confidence, manual actions. Nothing auto-applies."
      >
        {confidences.flatMap((confidence) =>
          [false, true].map((held) => (
            <Labeled
              key={`${confidence}${held}`}
              caption={`Confidence=${confidence}, State=${held ? 'Held' : 'Default'}`}
            >
              <View style={{ width: 328 }}>
                <SuggestionCard
                  category="Vocabulary gap"
                  confidence={confidence}
                  confidenceLabel={`${confidence[0]?.toUpperCase()}${confidence.slice(1)} confidence`}
                  suggestion="You noted “kottu” 3 times but it isn't in the vocabulary. Add it to Food?"
                  evidence="From 14 sessions, last 7 days"
                  held={held}
                  heldMessage="Held until the phase ends to keep the study fair"
                  primary={{ label: 'Apply', onPress: noop }}
                  secondary={{ label: 'See why', onPress: noop }}
                  tertiary={[
                    { label: 'Dismiss', onPress: noop },
                    { label: 'Later', onPress: noop },
                  ]}
                />
              </View>
            </Labeled>
          )),
        )}
      </Showcase>

      <Showcase title="ProgressBar" node="7:804" wide>
        {[0.25, 0.6, 1].map((v) => (
          <Labeled key={v} caption={`${Math.round(v * 100)} %`}>
            <View style={{ width: 328 }}>
              <ProgressBar value={v} accessibilityLabel="Progress" />
            </View>
          </Labeled>
        ))}
      </Showcase>
    </GalleryPage>
  );
}
