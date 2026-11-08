import { useState } from 'react';
import { Text } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { addDays } from '@/core/time';
import { facText, useTheme } from '@/core/theme';
import type { Role } from '@/core/types/common';
import {
  Button,
  Card,
  EmptyState,
  LoadGate,
  MixedText,
  ProgressBar,
  Screen,
  SegmentedControl,
  Stepper,
  TextField,
  ListRow,
} from '@/core/ui';
import {
  addProgress,
  archiveGoal,
  createGoal,
  listGoals,
  updateGoal,
  type GoalWithProgress,
  type TargetPeriod,
} from '../data/goalRepo';

const ROLES: Role[] = ['parent', 'slp', 'educator', 'ot'];
const PERIOD_DAYS: Record<TargetPeriod, number> = { week: 7, month: 30, term: 90 };

/** GL-1 list of goals. */
export function GoalsScreen({
  learnerId,
  onBack,
  onEdit,
  onAdd,
}: {
  learnerId: string;
  onBack?: () => void;
  onEdit: (goalId: string) => void;
  onAdd: () => void;
}) {
  const db = useDb();
  const { role } = useAppContext();
  const load = useLoad('goals', () => listGoals(db, learnerId, role ?? 'parent'), [db, learnerId, role]);
  return (
    <Screen
      title={t('goals.title')}
      onBack={onBack}
      testID="screen-goals"
      footer={<Button label={t('goals.add')} onPress={onAdd} />}
    >
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          load.data.length === 0 ? (
            <EmptyState title={t('goals.no_goals')} body={t('goals.no_goals_body')} icon="target" />
          ) : (
            load.data.map((g) => <GoalCard key={g.id} goal={g} onPress={() => onEdit(g.id)} />)
          )
        ) : null}
      </LoadGate>
    </Screen>
  );
}

function GoalCard({ goal, onPress }: { goal: GoalWithProgress; onPress: () => void }) {
  const { colors } = useTheme();
  const latest = goal.progress[goal.progress.length - 1];
  const achieved = latest?.achieved_count ?? 0;
  return (
    <Card>
      <MixedText text={goal.title} style={facText.heading} color={colors.fac.ink} />
      <Text style={[facText.body, { color: colors.fac.inkMuted }]}>
        {t('goals.target_line', { n: goal.target_count, period: t(`goals.period_${goal.target_period}`) })}
      </Text>
      <ProgressBar
        value={goal.target_count > 0 ? achieved / goal.target_count : 0}
        accessibilityLabel={t('report.goal_progress', {
          achieved,
          target: goal.target_count,
          period: t(`goals.period_${goal.target_period}`),
        })}
      />
      <Button label={t('common.edit')} variant="secondary" onPress={onPress} />
    </Card>
  );
}

/** GL-2 add or edit a goal, with entries for a chosen period. */
export function GoalEditScreen({
  learnerId,
  goalId,
  onDone,
  onBack,
}: {
  learnerId: string;
  goalId?: string;
  onDone: () => void;
  onBack?: () => void;
}) {
  const db = useDb();
  const { role } = useAppContext();
  const existing = useLoad(
    'goals',
    () => (goalId ? (listGoals(db, learnerId, 'parent').find((g) => g.id === goalId) ?? null) : null),
    [db, learnerId, goalId],
  );
  const [title, setTitle] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [period, setPeriod] = useState<TargetPeriod | null>(null);
  const [visible, setVisible] = useState<Role[] | null>(null);
  const [achieved, setAchieved] = useState(0);
  const [note, setNote] = useState('');

  const g = existing.status === 'ready' ? existing.data : null;
  const curTitle = title ?? g?.title ?? '';
  const curTarget = target ?? g?.target_count ?? 1;
  const curPeriod = period ?? g?.target_period ?? 'week';
  const curVisible = visible ?? g?.visible_to_roles ?? ['parent', role ?? 'parent'];

  const save = () => {
    try {
      if (goalId) {
        updateGoal(db, goalId, { title: curTitle, targetCount: curTarget, targetPeriod: curPeriod, visibleTo: curVisible });
      } else {
        createGoal(db, {
          learnerId,
          title: curTitle,
          role: role ?? 'parent',
          targetCount: curTarget,
          targetPeriod: curPeriod,
          visibleTo: curVisible,
        });
      }
      onDone();
    } catch (e) {
      logError('goals', 'save_failed', e);
    }
  };

  const addEntry = () => {
    if (!goalId) return;
    const end = addDays(new Date().toISOString().slice(0, 10), 1);
    addProgress(db, {
      goalId,
      periodStart: addDays(end, -PERIOD_DAYS[curPeriod]),
      periodEnd: end,
      achievedCount: achieved,
      note: note || undefined,
      role: role ?? 'parent',
    });
    setNote('');
    existing.reload();
  };

  return (
    <Screen
      title={goalId ? t('goals.edit') : t('goals.add')}
      onBack={onBack}
      testID="screen-goal-edit"
      footer={<Button label={t('common.save')} size="L" disabled={curTitle.trim() === ''} onPress={save} />}
    >
      <LoadGate status={existing.status} onRetry={existing.reload}>
        <TextField label={t('goals.title_field')} value={curTitle} onChangeText={setTitle} />
        <Stepper label={t('goals.target')} value={curTarget} min={1} onChange={setTarget} />
        <SegmentedControl
          accessibilityLabel={t('goals.period')}
          options={[
            { key: 'week', label: t('goals.period_week') },
            { key: 'month', label: t('goals.period_month') },
            { key: 'term', label: t('goals.period_term') },
          ]}
          selectedKey={curPeriod}
          onSelect={(k) => setPeriod(k as TargetPeriod)}
        />
        <Card title={t('goals.visible_to')}>
          {ROLES.map((r) => (
            <ListRow
              key={r}
              kind="toggle"
              title={t(`role.${r}`)}
              toggleValue={curVisible.includes(r)}
              toggleLocked={r === 'parent'}
              onToggle={(v) => setVisible(v ? [...curVisible, r] : curVisible.filter((x) => x !== r))}
            />
          ))}
        </Card>
        {goalId ? (
          <Card title={t('goals.add_entry')}>
            <Stepper label={t('goals.achieved')} value={achieved} onChange={setAchieved} />
            <TextField label={t('goals.note')} value={note} onChangeText={setNote} />
            <Button label={t('goals.add_entry')} variant="secondary" onPress={addEntry} />
            <Button
              label={t('goals.archive')}
              variant="danger"
              onPress={() => {
                archiveGoal(db, goalId);
                onDone();
              }}
            />
          </Card>
        ) : null}
      </LoadGate>
    </Screen>
  );
}
