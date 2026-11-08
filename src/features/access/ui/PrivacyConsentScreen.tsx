import { useState } from 'react';

import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { Button, Chip, LoadGate, ListRow, Screen, Toast } from '@/core/ui';
import {
  deleteAllRecords,
  getConsent,
  getLearner,
  saveConsent,
  withdrawFromResearch,
} from '../data/learnerRepo';
import { ConsentBanner } from './ConsentBanner';
import { PinConfirm } from './PinConfirm';

/** FB-02 Privacy and consent. Research logging and deletion are parent only. */
export function PrivacyConsentScreen({ onBack }: { onBack?: () => void }) {
  const db = useDb();
  const { role } = useAppContext();
  const isParent = role === 'parent';
  const load = useLoad(
    'access',
    () => {
      const learner = getLearner(db);
      return { learner, consent: learner ? (getConsent(db, learner.id) ?? null) : null };
    },
    [db],
  );
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <Screen title={t('privacy.title')} onBack={onBack} testID="screen-privacy">
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' && load.data.learner ? (
          <>
            <ConsentBanner title={t('privacy.banner_title')} body={t('privacy.banner_body')} />
            {load.data.consent?.guardian_consent_at ? (
              <Chip
                tone="success"
                label={t('privacy.consent_recorded', { date: load.data.consent.guardian_consent_at.slice(0, 10) })}
              />
            ) : (
              <Chip tone="warning" label={t('privacy.consent_missing')} />
            )}
            <ListRow
              kind="toggle"
              title={t('privacy.research_logging')}
              subtitle={t('privacy.research_logging_hint')}
              toggleValue={load.data.consent?.research_logging === 1}
              toggleLocked={!isParent || !!load.data.consent?.withdrawn_at}
              onToggle={(v) => {
                try {
                  saveConsent(db, load.data.learner!.id, { researchLogging: v }, role);
                  load.reload();
                } catch (e) {
                  logError('access', 'consent_save_failed', e);
                }
              }}
            />
            {isParent ? (
              <>
                <Button
                  label={t('privacy.withdraw')}
                  variant="secondary"
                  onPress={() => {
                    withdrawFromResearch(db, load.data.learner!.id, role);
                    load.reload();
                  }}
                />
                {confirming ? (
                  <PinConfirm
                    role="parent"
                    title={t('privacy.delete_all')}
                    onCancel={() => setConfirming(false)}
                    onConfirmed={() => {
                      try {
                        deleteAllRecords(db, role);
                        setToast(t('privacy.deleted_toast'));
                      } catch (e) {
                        logError('access', 'delete_all_failed', e);
                      }
                      setConfirming(false);
                    }}
                  />
                ) : (
                  <Button label={t('privacy.delete_all')} variant="danger" onPress={() => setConfirming(true)} />
                )}
              </>
            ) : null}
            {toast ? <Toast message={toast} /> : null}
          </>
        ) : null}
      </LoadGate>
    </Screen>
  );
}
