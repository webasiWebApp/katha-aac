import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import { useAppContext } from '@/core/app/AppContext';
import { useLoad } from '@/core/app/useLoad';
import { useDb } from '@/core/db';
import { getSetting, setSetting } from '@/core/db/settings';
import { t } from '@/core/i18n/t';
import { logError } from '@/core/log';
import { facText, space, useTheme } from '@/core/theme';
import { formatPeriod, formatShortDate, formatTime } from '@/core/time';
import type { Role } from '@/core/types/common';
import { BarChart, Button, Card, LoadGate, ListRow, Screen, SegmentedControl, Toast } from '@/core/ui';
import { RequireRole, canView, getLearner, loadPermissions, ROLES, useCanView } from '@/features/access/index';
import { listMessages, type MessageFilter } from '@/features/event-log/index';
import { getMeasures } from '@/features/analytics/index';
import { TagSheet, getForMessages, intentMap } from '@/features/observations/index';
import { getReportDefinition, allReportDefinitions } from '../registry';
import type { MessageHistoryEntry } from '../shared/types';
import { LimitationBanner } from '../shared/ui/LimitationBanner';
import { MessageHistoryRow } from '../shared/ui/MessageHistoryRow';
import { MetricCard } from '../shared/ui/MetricCard';
import { PeriodPicker, PeriodSheet } from '../shared/ui/PeriodPicker';
import { ReportView } from './ReportView';
import { formatCustomRange } from '../domain/customPeriod';
import { periodFor, usePeriod, useReport, type PickerPreset } from './useReport';

const PRESET_LABEL: Record<PickerPreset, string> = {
  today: 'dashboard.today',
  '7d': 'dashboard.last_7d',
  '30d': 'dashboard.last_30d',
  custom: 'period.custom',
};

/** Period picker button plus its sheet (Today, 7 days, 30 days, Custom with two date fields). */
function PeriodControl({ state }: { state: ReturnType<typeof usePeriod> }) {
  const [sheet, setSheet] = useState(false);
  const label = state.preset === 'custom' ? formatCustomRange(state.custom) : t(PRESET_LABEL[state.preset]);
  return (
    <>
      <PeriodPicker label={label} accessibilityLabel={`${t('dashboard.period')}: ${label}`} onPress={() => setSheet(true)} />
      {sheet ? (
        <PeriodSheet
          selectedPreset={state.preset}
          customRange={state.custom}
          onApplyCustom={state.applyCustom}
          onSelect={state.setPreset}
          onClose={() => setSheet(false)}
        />
      ) : null}
    </>
  );
}

/** R-01 to R-04: one role's report. */
export function ReportScreen({
  role,
  initialPreset = '7d',
  enabledSections,
  onBack,
  onShare,
  onHistory,
}: {
  role: Role;
  initialPreset?: PickerPreset;
  enabledSections?: string[];
  onBack?: () => void;
  onShare?: (role: Role, period: { start: string; end: string }) => void;
  onHistory?: () => void;
}) {
  const db = useDb();
  const periodState = usePeriod(initialPreset);
  const { period } = periodState;
  const report = useReport(role, period);
  const canExport = useCanView('export');
  const canHistory = useCanView('history');
  const defaults = getSetting<string[] | null>(db, `report.defaults.${role}`, null);

  return (
    <Screen title={t(`report.${role}.title`)} onBack={onBack} testID={`screen-report-${role}`}>
      <RequireRole resource={`report:${role}` as const}>
        <PeriodControl state={periodState} />
        <LoadGate status={report.status} onRetry={report.reload}>
          {report.status === 'ready' ? (
            <ReportView
              definition={report.data.definition}
              results={report.data.results}
              learner={report.data.learner}
              period={period}
              enabledSections={enabledSections ?? defaults ?? undefined}
              onShare={canExport && onShare ? () => onShare(role, period) : undefined}
              onHistory={canHistory && onHistory ? onHistory : undefined}
            />
          ) : null}
        </LoadGate>
      </RequireRole>
    </Screen>
  );
}

/** DB-01 / DB-03 Dashboard. Shows the overview measures the signed-in role may read. */
export function DashboardScreen({
  onOpenReport,
  onBuild,
}: {
  onOpenReport: (role: Role) => void;
  onBuild: () => void;
}) {
  const db = useDb();
  const { role } = useAppContext();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const periodState = usePeriod('7d');
  const { period } = periodState;
  const tablet = width >= 840;

  const load = useLoad(
    'reports',
    () => {
      const learner = getLearner(db);
      if (!learner || !role) throw new Error('dashboard_unavailable');
      const def = getReportDefinition(role);
      const allowed = new Set<string>(['sessions', ...(def ? [...def.glance, ...def.sections.flatMap((s) => s.measures)] : [])]);
      const want = ['sessions', 'messages_sent', 'words_used', 'independent_starts'].filter((id) => role === 'parent' || allowed.has(id));
      const results = getMeasures(db, { learnerId: learner.id, period, role, ids: want as never });
      const chart = role === 'parent' || allowed.has('messages_sent') ? getMeasures(db, { learnerId: learner.id, period, role, ids: ['messages_sent'] }) : null;
      return { learner, results, chart, roles: allReportDefinitions().map((d) => d.role).filter((r) => canView(role, `report:${r}`, loadPermissions(db))) };
    },
    [db, role, period.start, period.end],
  );

  return (
    <Screen title={t('dashboard.title')} wide testID="screen-dashboard">
      <PeriodControl state={periodState} />
      <LoadGate status={load.status} onRetry={load.reload}>
        {load.status === 'ready' ? (
          <View style={{ flexDirection: tablet ? 'row' : 'column', gap: space.s16 }}>
            <View style={{ flex: 1, gap: space.s16 }}>
              <Card title={load.data.learner.display_name} body={`${load.data.learner.participant_code} · ${formatPeriod(period)}`} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s12 }}>
                {Object.values(load.data.results).map((r) => (
                  <View key={r!.id} style={{ width: '47%', flexGrow: 1 }}>
                    <MetricCard result={r!} label={t(`measure.${r!.id}`)} />
                  </View>
                ))}
              </View>
              {load.data.chart?.messages_sent ? (
                <BarChart
                  width={328}
                  height={180}
                  bars={[{ key: 'm', label: t('measure.messages_sent'), value: load.data.chart.messages_sent.value ?? 0, valueLabel: String(load.data.chart.messages_sent.value ?? 0) }]}
                  accessibilityLabel={t('measure.messages_sent')}
                />
              ) : null}
              <LimitationBanner />
              {load.data.results.sessions?.value === 0 ? (
                <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('dashboard.no_sessions')}</Text>
              ) : null}
            </View>
            <View style={{ flex: 1, gap: space.s8 }}>
              <Text style={[facText.heading, { color: colors.fac.ink }]}>{t('dashboard.reports_by_role')}</Text>
              {load.data.roles.map((r) => (
                <ListRow key={r} kind="navigation" title={t(`report.${r}.title`)} icon="chart" onPress={() => onOpenReport(r)} />
              ))}
              <Button label={t('dashboard.build')} variant="secondary" onPress={onBuild} />
            </View>
          </View>
        ) : null}
      </LoadGate>
    </Screen>
  );
}

/** DB-02 / DB-04 Report builder with a live preview on tablets. */
export function BuilderScreen({ onBack, onOpen }: { onBack?: () => void; onOpen: (role: Role, sections: string[]) => void }) {
  const db = useDb();
  const { role: me } = useAppContext();
  const { width } = useWindowDimensions();
  const roles = (() => {
    try {
      const perms = loadPermissions(db);
      return ROLES.filter((r) => canView(me, `report:${r}`, perms) && getReportDefinition(r));
    } catch {
      return [];
    }
  })();
  const [role, setRole] = useState<Role>(roles[0] ?? 'parent');
  const { preset, setPreset } = usePeriod('7d');
  const [off, setOff] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);
  const def = getReportDefinition(role);
  const saved0 = getSetting<string[] | null>(db, `report.defaults.${role}`, null);
  const enabled = def ? def.sections.filter((s) => s.required || !(off[role] ?? def.sections.filter((x) => saved0 && !saved0.includes(x.id)).map((x) => x.id)).includes(s.id)).map((s) => s.id) : [];
  const tablet = width >= 840;
  const preview = useReport(role, periodFor(preset));

  const toggle = (id: string, on: boolean) => {
    const current = off[role] ?? (def ? def.sections.filter((x) => saved0 && !saved0.includes(x.id)).map((x) => x.id) : []);
    setOff({ ...off, [role]: on ? current.filter((x) => x !== id) : [...new Set([...current, id])] });
  };

  return (
    <Screen title={t('builder.title')} onBack={onBack} wide testID="screen-builder">
      <View style={{ flexDirection: tablet ? 'row' : 'column', gap: space.s16 }}>
        <View style={{ width: tablet ? 360 : '100%', gap: space.s12 }}>
          <SegmentedControl
            accessibilityLabel={t('builder.role')}
            options={roles.map((r) => ({ key: r, label: t(`role.${r}`) }))}
            selectedKey={role}
            onSelect={(k) => setRole(k as Role)}
          />
          <SegmentedControl
            accessibilityLabel={t('dashboard.period')}
            options={[
              { key: 'today', label: t('dashboard.today') },
              { key: '7d', label: t('dashboard.last_7d') },
              { key: '30d', label: t('dashboard.last_30d') },
            ]}
            selectedKey={preset === 'custom' ? '30d' : preset}
            onSelect={(k) => setPreset(k as PickerPreset)}
          />
          {def?.sections.map((s) => (
            <ListRow
              key={s.id}
              kind="toggle"
              title={t(s.titleKey)}
              toggleValue={enabled.includes(s.id)}
              toggleLocked={s.required}
              onToggle={(v) => toggle(s.id, v)}
            />
          ))}
          <Button label={t('builder.preview')} onPress={() => onOpen(role, enabled)} />
          <Button
            label={t('builder.save_default')}
            variant="secondary"
            onPress={() => {
              try {
                setSetting(db, `report.defaults.${role}`, enabled);
                setSaved(true);
              } catch (e) {
                logError('reports', 'save_default_failed', e);
              }
            }}
          />
          {saved ? <Toast message={t('builder.saved')} /> : null}
        </View>
        {tablet ? (
          <View style={{ flex: 1 }}>
            <LoadGate status={preview.status} onRetry={preview.reload}>
              {preview.status === 'ready' ? (
                <ReportView
                  definition={preview.data.definition}
                  results={preview.data.results}
                  learner={preview.data.learner}
                  period={periodFor(preset)}
                  enabledSections={enabled}
                />
              ) : null}
            </LoadGate>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

/** DB-06 Message history. */
export function HistoryScreen({ onBack }: { onBack?: () => void }) {
  const db = useDb();
  const [filter, setFilter] = useState<MessageFilter>('all');
  const periodState = usePeriod('7d');
  const { period } = periodState;
  const [tagging, setTagging] = useState<{ id: string; text: string } | null>(null);
  const canTag = useCanView('observations:enter');

  const load = useLoad(
    'reports',
    () => {
      const learner = getLearner(db);
      if (!learner) throw new Error('no_learner');
      const items = listMessages(db, learner.id, period, filter, (ids) => intentMap(db, ids));
      const prompting = new Map(
        getForMessages(db, items.map((i) => i.id)).filter((o) => o.kind === 'prompting').map((o) => [o.message_id as string, o.value]),
      );
      return items.map(
        (m): MessageHistoryEntry => ({
          id: m.id,
          sentence: m.text,
          symbolCount: m.symbolCount,
          at: m.at,
          offsetMin: m.offsetMin,
          source: !prompting.has(m.id) ? 'not_recorded' : prompting.get(m.id) === 'independent' ? 'independent' : 'prompted',
          answer: m.intent,
        }),
      );
    },
    [db, filter, period.start, period.end],
  );

  return (
    <Screen title={t('history.title')} onBack={onBack} testID="screen-history">
      <RequireRole resource="history">
        <PeriodControl state={periodState} />
        <SegmentedControl
          accessibilityLabel={t('history.title')}
          options={[
            { key: 'all', label: t('history.all') },
            { key: 'built', label: t('history.built') },
            { key: 'stored_phrase', label: t('history.stored') },
          ]}
          selectedKey={filter}
          onSelect={(k) => setFilter(k as MessageFilter)}
        />
        <LoadGate status={load.status} onRetry={load.reload}>
          {load.status === 'ready' ? (
            load.data.length === 0 ? (
              <Text>{t('history.empty')}</Text>
            ) : (
              load.data.map((e) => (
                <View key={e.id} onTouchEnd={() => canTag && setTagging({ id: e.id, text: e.sentence })}>
                  <MessageHistoryRow entry={e} timeLabel={`${formatShortDate(e.at, e.offsetMin)} · ${formatTime(e.at, e.offsetMin)}`} />
                </View>
              ))
            )
          ) : null}
        </LoadGate>
        {tagging ? (
          <TagSheet
            messageId={tagging.id}
            sentence={tagging.text}
            onClose={() => {
              setTagging(null);
              load.reload();
            }}
          />
        ) : null}
      </RequireRole>
    </Screen>
  );
}
