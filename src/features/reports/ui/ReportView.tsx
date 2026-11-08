import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/core/i18n/t';
import { facText, radius, space, useTheme } from '@/core/theme';
import type { Period } from '@/core/types/common';
import { Button, Chip, EmptyState } from '@/core/ui';
import { RoleBadge } from '@/features/access/index';
import { planningIdea } from '../shared/planningIdeas';
import { SectionView, type Results } from '../shared/sections/SectionRenderers';
import type { ReportDefinition } from '../shared/types';
import { LimitationBanner } from '../shared/ui/LimitationBanner';
import { MetricCard } from '../shared/ui/MetricCard';

export interface ReportViewProps {
  definition: ReportDefinition;
  results: Results;
  learner: { displayName: string; code: string; fictional: boolean };
  period: Period;
  /** Section ids switched on. Undefined = all. Header, notice and glance are never switchable. */
  enabledSections?: string[];
  onShare?: () => void;
  onHistory?: () => void;
}

/** The report body shared by R-01 to R-04, the builder preview and the PDF layout. */
export function ReportView({ definition, results, learner, period, enabledSections, onShare, onHistory }: ReportViewProps) {
  const { colors } = useTheme();
  const sessions = results.sessions;
  const sessionCount = sessions?.value ?? 0;
  const days = (sessions?.detail as { daysWithSessions: number } | undefined)?.daysWithSessions ?? 0;
  const idea = planningIdea(definition.role, results);
  const sections = definition.sections.filter((s) => s.required || !enabledSections || enabledSections.includes(s.id));

  return (
    <View style={styles.root} testID={`report-${definition.role}`}>
      <View style={[styles.header, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}>
        <RoleBadge role={definition.role} />
        <Text style={[facText.title, { color: colors.fac.ink }]}>{t(definition.titleKey)}</Text>
        <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{`${learner.displayName} · ${learner.code}`}</Text>
        <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{`${period.start} – ${period.end}`}</Text>
        <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>
          {t('report.header.sessions', { sessions: sessionCount, days })}
        </Text>
        {learner.fictional ? <Chip tone="warning" label={t('common.sample_data')} /> : null}
      </View>

      <LimitationBanner />

      {sessionCount === 0 ? (
        <EmptyState title={t('report.empty_title')} body={t('report.empty_body')} />
      ) : (
        <>
          <Text style={[facText.heading, { color: colors.fac.ink }]}>{t('report.glance')}</Text>
          <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{t(definition.subtitleKey)}</Text>
          <View style={styles.glance} testID="report-glance">
            {definition.glance.map((id) => {
              const r = results[id];
              if (!r) return null;
              const labelKey = definition.glanceLabelKeys?.[id] ?? `measure.${id}`;
              return (
                <View key={id} style={styles.glanceCell}>
                  <MetricCard result={r} label={t(labelKey)} />
                </View>
              );
            })}
          </View>
          {sections.map((s) => (
            <SectionView key={s.id} section={s} results={results} idea={idea} />
          ))}
        </>
      )}

      {onShare ? <Button label={t('report.share_export')} variant="primary" onPress={onShare} /> : null}
      {onHistory ? <Button label={t('report.view_history')} variant="secondary" onPress={onHistory} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.s16 },
  header: { borderWidth: 1, borderRadius: radius.lg, padding: space.s16, gap: space.s4, alignItems: 'flex-start' },
  glance: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s12 },
  glanceCell: { width: '47%', flexGrow: 1 },
});
