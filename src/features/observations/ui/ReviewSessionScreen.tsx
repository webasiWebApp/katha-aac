import { useState } from 'react';
import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { formatShortDate, formatTime } from '@/core/time';
import { Button, Card, EmptyState, LoadGate, ListRow, Screen, Stepper, TextField, Toast } from '@/core/ui';
import { listSessionMessages } from '@/features/event-log/index';
import { getSession, markReviewed } from '@/features/sessions/index';
import {
  getForMessages,
  getForSessions,
  setOpportunities,
  setSetupNote,
} from '../data/observationRepo';
import { TagSheet } from './TagSheet';

/** RS-1 Review session: tag messages, enter opportunities, add a setup note. */
export function ReviewSessionScreen({
  sessionId,
  onDone,
  onBack,
}: {
  sessionId: string;
  onDone: () => void;
  onBack?: () => void;
}) {
  const db = useDb();
  const { role } = useAppContext();
  const load = useLoad(
    'observations',
    () => {
      const session = getSession(db, sessionId);
      if (!session) throw new Error('session_not_found');
      const messages = listSessionMessages(db, sessionId);
      const obs = getForMessages(db, messages.map((m) => m.id));
      const sessionObs = getForSessions(db, [sessionId]);
      return { session, messages, obs, sessionObs };
    },
    [db, sessionId],
  );
  const [tagging, setTagging] = useState<string | null>(null);
  const [observed, setObserved] = useState<number | null>(null);
  const [independent, setIndependent] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canNote = role === 'ot' || role === 'parent';

  const save = () => {
    if (!role || load.status !== 'ready') return;
    try {
      const o = observed ?? load.data.sessionObs.find((x) => x.kind === 'opportunities')?.count_a ?? null;
      const i = independent ?? load.data.sessionObs.find((x) => x.kind === 'opportunities')?.count_b ?? null;
      if (observed !== null || independent !== null) {
        setOpportunities(db, role, sessionId, o, Math.min(i ?? 0, o ?? 0));
      }
      if (canNote && note !== null) setSetupNote(db, role, sessionId, note);
      markReviewed(db, sessionId);
      setSaved(true);
      setTimeout(onDone, 600);
    } catch (e) {
      logError('observations', 'review_save_failed', e);
    }
  };

  return (
    <Screen
      title={t('review.title')}
      onBack={onBack}
      testID="screen-review-session"
      footer={<Button label={t('review.save')} size="L" onPress={save} />}
    >
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          <>
            <Card
              title={`${formatShortDate(load.data.session.started_at, load.data.session.offset_min)} · ${formatTime(load.data.session.started_at, load.data.session.offset_min)}`}
              body={`${t(`session.setting_${load.data.session.setting}`)} · ${t('report.minutes', { n: Math.round(load.data.session.active_ms / 60000) })}`}
            />
            {load.data.messages.length === 0 ? (
              <EmptyState title={t('review.no_messages')} body={t('review.no_messages_body')} icon="note" />
            ) : (
              load.data.messages.map((m) => {
                const mine = load.data.obs.filter((o) => o.message_id === m.id);
                const tags = mine.map((o) => t(`tag.${o.value}`)).join(', ');
                return (
                  <ListRow
                    key={m.id}
                    kind="navigation"
                    title={m.text}
                    subtitle={`${formatTime(m.at, m.offsetMin)} · ${m.symbolCount} · ${tags === '' ? t('common.not_recorded') : tags}`}
                    onPress={() => setTagging(m.id)}
                  />
                );
              })
            )}
            <Card title={t('review.opportunities_card')}>
              <Stepper
                label={t('review.opportunities')}
                value={observed ?? load.data.sessionObs.find((x) => x.kind === 'opportunities')?.count_a ?? 0}
                onChange={(v) => {
                  setObserved(v);
                  if ((independent ?? 0) > v) setIndependent(v);
                }}
              />
              <Stepper
                label={t('review.independent_starts')}
                value={independent ?? load.data.sessionObs.find((x) => x.kind === 'opportunities')?.count_b ?? 0}
                max={observed ?? load.data.sessionObs.find((x) => x.kind === 'opportunities')?.count_a ?? 0}
                onChange={setIndependent}
              />
              <Button
                label={t('common.not_recorded')}
                variant="ghost"
                onPress={() => {
                  if (!role) return;
                  setOpportunities(db, role, sessionId, null, null);
                  setObserved(0);
                  setIndependent(0);
                }}
              />
            </Card>
            {canNote ? (
              <TextField
                label={t('review.setup_note')}
                value={note ?? load.data.sessionObs.find((x) => x.kind === 'setup_note')?.value ?? ''}
                onChangeText={(v) => setNote(v.slice(0, 280))}
              />
            ) : null}
            {saved ? <Toast message={t('review.saved')} /> : null}
          </>
        ) : null}
      </LoadGate>
      {tagging ? (
        <TagSheet
          messageId={tagging}
          sentence={load.status === 'ready' ? (load.data.messages.find((m) => m.id === tagging)?.text ?? '') : ''}
          onClose={() => {
            setTagging(null);
            load.reload();
          }}
        />
      ) : null}
    </Screen>
  );
}
