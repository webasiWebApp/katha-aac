import { useState } from 'react';
import { View } from 'react-native';

import { useDb } from '@/core/db';
import { getSetting, setSetting } from '@/core/db/settings';
import { t } from '@/core/i18n/t';
import { space } from '@/core/theme';
import type { GridSize } from '@/core/types/common';
import { ListRow, SegmentedControl } from '@/core/ui';
import { getLearner, updateLearner, type Learner } from '../data/learnerRepo';

const IDLE_OPTIONS = [
  { key: '15', label: '15 s' },
  { key: '30', label: '30 s' },
  { key: '60', label: '60 s' },
  { key: '0', label: 'Off' },
] as const;

/** Hand, grid size, idle return and reduced motion for one learner (FB-03 and ST-1). */
export function LearnerPreferences({
  learner,
  editable,
  showAdultCheck = false,
  onChanged,
}: {
  learner: Learner;
  editable: boolean;
  showAdultCheck?: boolean;
  onChanged?: (l: Learner) => void;
}) {
  const db = useDb();
  const [l, setL] = useState(learner);
  const [adultCheck, setAdultCheck] = useState(() => getSetting<boolean>(db, 'childView.adultCheck', true));

  const save = (patch: Parameters<typeof updateLearner>[2]) => {
    if (!editable) return;
    updateLearner(db, l.id, patch);
    const next = getLearner(db) ?? l;
    setL(next);
    onChanged?.(next);
  };

  return (
    <View style={{ gap: space.s16 }}>
      <SegmentedControl
        accessibilityLabel={t('prefs.hand')}
        options={[
          { key: 'right', label: t('prefs.hand_right') },
          { key: 'left', label: t('prefs.hand_left') },
        ]}
        selectedKey={l.hand}
        onSelect={(k) => save({ hand: k as 'right' | 'left' })}
      />
      <SegmentedControl
        accessibilityLabel={t('prefs.grid')}
        options={[
          { key: '3x4', label: '3x4' },
          { key: '4x5', label: '4x5' },
          { key: '5x6', label: '5x6' },
        ]}
        selectedKey={l.grid_size}
        onSelect={(k) => save({ grid_size: k as GridSize })}
      />
      <SegmentedControl
        accessibilityLabel={t('prefs.idle')}
        options={IDLE_OPTIONS}
        selectedKey={String(l.idle_return_seconds)}
        onSelect={(k) => save({ idle_return_seconds: Number(k) })}
      />
      <ListRow
        kind="toggle"
        title={t('prefs.reduced_motion')}
        toggleValue={l.reduced_motion === 1}
        toggleLocked={!editable}
        onToggle={(v) => save({ reduced_motion: v ? 1 : 0 })}
      />
      {showAdultCheck ? (
        <ListRow
          kind="toggle"
          title={t('prefs.adult_check')}
          subtitle={t('prefs.adult_check_hint')}
          toggleValue={adultCheck}
          toggleLocked={!editable}
          onToggle={(v) => {
            if (!editable) return;
            setSetting(db, 'childView.adultCheck', v);
            setAdultCheck(v);
          }}
        />
      ) : null}
    </View>
  );
}
