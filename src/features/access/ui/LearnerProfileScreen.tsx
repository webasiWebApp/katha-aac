import { useState } from 'react';

import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { Button, Chip, LoadGate, ListRow, Screen, TextField } from '@/core/ui';
import { getLearner, updateLearner } from '../data/learnerRepo';
import { LearnerPreferences } from './LearnerPreferences';

/** FB-03 Learner profile. Only the parent may edit. */
export function LearnerProfileScreen({
  onBack,
  onOpenVoice,
  onOpenGoals,
}: {
  onBack?: () => void;
  onOpenVoice?: () => void;
  onOpenGoals?: () => void;
}) {
  const db = useDb();
  const { role } = useAppContext();
  const load = useLoad('access', () => getLearner(db) ?? null, [db]);
  const [name, setName] = useState<string | null>(null);
  const editable = role === 'parent';

  return (
    <Screen title={t('profile.title')} onBack={onBack} testID="screen-learner-profile">
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' && load.data ? (
          <>
            {load.data.is_fictional === 1 ? <Chip tone="warning" label={t('common.fictional_profile')} /> : null}
            <TextField
              label={t('profile.display_name')}
              value={name ?? load.data.display_name}
              locked={!editable}
              onChangeText={setName}
            />
            <TextField label={t('profile.participant_code')} value={load.data.participant_code} locked />
            {editable && name !== null && name.trim() !== '' && name !== load.data.display_name ? (
              <Button
                label={t('common.save')}
                onPress={() => {
                  updateLearner(db, load.data!.id, { display_name: name.trim() });
                  setName(null);
                  load.reload();
                }}
              />
            ) : null}
            <LearnerPreferences learner={load.data} editable={editable} />
            <ListRow kind="navigation" title={t('settings.voice_audio')} icon="speaker" onPress={onOpenVoice} />
            <ListRow kind="navigation" title={t('goals.title')} icon="target" onPress={onOpenGoals} />
          </>
        ) : null}
      </LoadGate>
    </Screen>
  );
}
