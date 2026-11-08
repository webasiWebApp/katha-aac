import { useState } from 'react';
import { formatPeriod } from '@/core/time';
import { Text } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useDb } from '@/core/db';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, useTheme } from '@/core/theme';
import type { Period, Role } from '@/core/types/common';
import { Card, Dialog, ListRow, LoadGate, Screen, Toast } from '@/core/ui';
import { ConsentBanner, RequireRole } from '@/features/access/index';
import { useReport } from '@/features/reports/index';
import { deviceExportFor } from '../data/exportInstance';
import { logExport, mayExport, type Destination } from '../data/exportRepo';
import { buildReportHtml } from '../domain/reportHtml';

export type ExportFn = (html: string, destination: Destination, fileName: string) => Promise<void>;

/** DB-05 Share and consent: every export asks for consent, then logs the export (no content). */
export function ShareScreen({
  role,
  period,
  enabledSections,
  onBack,
  exporter,
}: {
  role: Role;
  period: Period;
  enabledSections?: string[];
  onBack?: () => void;
  exporter?: ExportFn;
}) {
  const db = useDb();
  const { role: me } = useAppContext();
  const { colors } = useTheme();
  const report = useReport(role, period);
  const [pending, setPending] = useState<Destination | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const allowed = mayExport(db, me, role);

  const confirm = async () => {
    if (!pending || report.status !== 'ready') return;
    const destination = pending;
    const consentAt = new Date().toISOString();
    setPending(null);
    try {
      const html = buildReportHtml(report.data.definition, report.data.results, {
        learnerName: report.data.learner.displayName,
        code: report.data.learner.code,
        period,
        generatedOn: consentAt.slice(0, 10),
        fictional: report.data.learner.fictional,
        enabledSections,
        fontCss: await deviceExportFor().fontCss(),
      });
      await (exporter ?? deviceExportFor().export)(html, destination, `katha-${role}-${period.start}.pdf`);
      logExport(db, { role, period, destination, consentAt });
      setToast(t('share.done'));
      setFailed(false);
    } catch (e) {
      logError('share', 'export_failed', e);
      setFailed(true);
    }
  };

  return (
    <Screen title={t('share.title')} onBack={onBack} testID="screen-share">
      <RequireRole resource="export">
        {!allowed ? (
          <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('common.not_available')}</Text>
        ) : (
          <LoadGate status={report.status} onRetry={report.reload}>
            {report.status === 'ready' ? (
              <>
                <Card
                  title={t(report.data.definition.titleKey)}
                  body={`${report.data.learner.displayName} · ${report.data.learner.code} · ${formatPeriod(period)}`}
                />
                <ConsentBanner title={t('share.consent_required')} body={t('share.consent_body')} />
                <ListRow kind="navigation" title={t('share.save')} icon="download" onPress={() => setPending('save')} />
                <ListRow kind="navigation" title={t('share.share')} icon="share" onPress={() => setPending('share')} />
                <ListRow kind="navigation" title={t('share.print')} icon="file" onPress={() => setPending('print')} />
                {pending ? (
                  <Dialog
                    title={t('share.dialog_title')}
                    body={t('share.dialog_body', { role: t(`role.${role}`), code: report.data.learner.code })}
                    cancelLabel={t('share.cancel')}
                    confirmLabel={t('share.confirm')}
                    onCancel={() => setPending(null)}
                    onConfirm={() => void confirm()}
                  />
                ) : null}
                {failed ? <Text style={[facText.body, { color: colors.fac.danger }]}>{t('errors.export_failed')}</Text> : null}
                {toast ? <Toast message={toast} /> : null}
              </>
            ) : null}
          </LoadGate>
        )}
      </RequireRole>
    </Screen>
  );
}
