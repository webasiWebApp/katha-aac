import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { addDays, formatShortDate, formatTime } from '@/core/time';
import { Button, Card, EmptyState, LoadGate, ListRow, Screen, StatTile } from '@/core/ui';
import { canView, loadPermissions } from '@/features/access/index';
import { listMessages } from '@/features/event-log/index';
import { listSessions, listUnreviewedSessions } from '../data/sessionRepo';

const today = (): string => {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

/** AH-1 Adult home. */
export function AdultHomeScreen({
  learnerId,
  onStart,
  onReview,
  onPinningHelp,
  onOpenReports,
}: {
  learnerId: string;
  onStart: () => void;
  onReview: (sessionId: string) => void;
  onPinningHelp?: () => void;
  onOpenReports?: () => void;
}) {
  const db = useDb();
  const { role } = useAppContext();
  const load = useLoad(
    'sessions',
    () => {
      const period = { start: addDays(today(), -6), end: addDays(today(), 1) };
      return {
        unreviewed: listUnreviewedSessions(db, learnerId),
        sessions7: listSessions(db, learnerId, period).length,
        messages7: listMessages(db, learnerId, period, 'all').length,
        canReview: canView(role, 'observations:enter', loadPermissions(db)),
      };
    },
    [db, learnerId, role],
  );

  return (
    <Screen title={t('home.title')} testID="screen-adult-home">
      <Button label={t('home.start_child_mode')} size="L" onPress={onStart} />
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          <>
            <Card title={t('home.to_review', { n: load.data.unreviewed.length })}>
              {load.data.unreviewed.length === 0 ? (
                <EmptyState title={t('home.nothing_to_review')} body={t('home.nothing_to_review_body')} icon="check" />
              ) : (
                load.data.unreviewed.map((s) => (
                  <ListRow
                    key={s.id}
                    kind="navigation"
                    title={`${formatShortDate(s.started_at, s.offset_min)} · ${formatTime(s.started_at, s.offset_min)}`}
                    subtitle={t(`session.setting_${s.setting}`)}
                    onPress={load.data.canReview ? () => onReview(s.id) : undefined}
                  />
                ))
              )}
            </Card>
            <StatTile label={t('home.messages_7d')} value={String(load.data.messages7)} trend="flat" delta={t('home.last_7_days')} />
            <StatTile label={t('home.sessions_7d')} value={String(load.data.sessions7)} trend="flat" delta={t('home.last_7_days')} />
            {onOpenReports ? <ListRow kind="navigation" title={t('home.reports')} icon="chart" onPress={onOpenReports} /> : null}
            <ListRow kind="navigation" title={t('home.pinning_help')} icon="pin" onPress={onPinningHelp} />
          </>
        ) : null}
      </LoadGate>
    </Screen>
  );
}
