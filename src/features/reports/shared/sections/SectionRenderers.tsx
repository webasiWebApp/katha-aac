import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/core/i18n/t';
import { facText, radius, space, useTheme } from '@/core/theme';
import { BarChart, Card, LineChart, MixedText, ProgressBar } from '@/core/ui';
import type { PlanningIdea } from '../planningIdeas';
import type { MeasureResult, ReportSection } from '../types';
import { BarRow } from '../ui/BarRow';
import { MetricCard } from '../ui/MetricCard';
import { SectionHeader } from '../ui/SectionHeader';
import { WordChip } from '../ui/WordChip';

export type Results = Record<string, MeasureResult | undefined>;

interface Props {
  section: ReportSection;
  results: Results;
  idea: PlanningIdea | null;
}

interface WordItem {
  symbolId: string;
  label: string;
  count: number;
}

const lockedLine = (n: number) => t('report.locked_list', { n });

/** One component per SectionKind (T-131). Locked results show a caption instead of a chart or list. */
export function SectionView({ section, results, idea }: Props) {
  const { colors } = useTheme();
  const first = results[section.measures[0] ?? ''];
  const subtitle = subtitleFor(section, results);

  if (section.kind === 'planningIdea' && !idea) return null;

  const body = (() => {
    switch (section.kind) {
      case 'wordChips': {
        const words = ((first?.detail as WordItem[] | undefined) ?? []).slice(0, 6);
        const fresh = (results.new_words?.detail as WordItem[] | undefined) ?? [];
        return (
          <>
            <View style={styles.wrap}>
              {words.map((w) => (
                <WordChip key={w.symbolId} word={w.label} count={w.count} />
              ))}
              {words.length === 0 ? <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('report.no_data')}</Text> : null}
            </View>
            {section.measures.includes('new_words') && fresh.length > 0 ? (
              <MixedText
                text={`${t('report.new_this_week')}: ${fresh.map((w) => w.label).join(', ')}`}
                style={facText.caption}
                color={colors.fac.inkMuted}
              />
            ) : null}
          </>
        );
      }

      case 'barRows': {
        if (first?.locked) return <Locked n={first.sessionsSoFar} />;
        const rows = barRows(section, results);
        const max = Math.max(1, ...rows.map((r) => r.value));
        return (
          <View style={{ gap: space.s8 }}>
            {rows.map((r) => (
              <BarRow key={r.label} label={r.label} value={r.value} max={r.max ?? max} valueLabel={r.valueLabel} />
            ))}
          </View>
        );
      }

      case 'barChart': {
        const d = (first?.detail ?? {}) as Record<'morning' | 'afternoon' | 'evening' | 'night', number>;
        const bars = (['morning', 'afternoon', 'evening', 'night'] as const).map((k) => ({
          key: k,
          label: t(`bucket.${k}`),
          value: d[k] ?? 0,
          valueLabel: String(d[k] ?? 0),
        }));
        return <BarChart width={328} height={180} bars={bars} accessibilityLabel={t(section.titleKey)} />;
      }

      case 'lineChart': {
        const weeks = ((first?.detail as { weeks?: number[] } | undefined)?.weeks ?? []).slice();
        const top = Math.max(4, ...weeks);
        return (
          <LineChart
            width={328}
            height={210}
            series={[{ key: 'weekly', label: '', color: colors.fac.primary, values: weeks }]}
            yTicks={[0, Math.ceil(top / 2), top].map((v) => ({ value: v, label: String(v) }))}
            xCaption={t('report.educator.weekly.title')}
            accessibilityLabel={t(section.titleKey)}
          />
        );
      }

      case 'combinations': {
        const d = first?.detail as { top: { labels: string[]; count: number }[] } | undefined;
        return (
          <View style={{ gap: space.s8 }}>
            {(d?.top ?? []).map((c, i) => (
              <View key={i} style={[styles.seq, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}>
                <MixedText text={c.labels.join(' + ')} style={facText.sinhalaStrong} color={colors.fac.ink} />
                <Text style={[facText.captionStrong, { color: colors.fac.inkMuted }]}>{t('report.sequence_count', { n: c.count })}</Text>
              </View>
            ))}
          </View>
        );
      }

      case 'metricPair': {
        if (section.measures[0] === 'latency_within_session') {
          const d = first?.detail as { enough: boolean; first: number | null; last: number | null } | undefined;
          return (
            <View style={styles.pair}>
              <PairCard label={t('report.first_3min')} value={d?.first} />
              <PairCard label={t('report.last_3min')} value={d?.last} />
            </View>
          );
        }
        return (
          <View style={styles.pair}>
            {section.measures.map((id) => {
              const r = results[id];
              return r ? (
                <View key={id} style={{ flex: 1 }}>
                  <MetricCard result={r} label={t(`measure.${id}`)} />
                </View>
              ) : null;
            })}
          </View>
        );
      }

      case 'latencyCard': {
        if (!first) return null;
        if (section.measures[0] === 'pages_per_session') {
          return <Text style={[facText.stat, { color: colors.fac.ink }]}>{first.value === null ? '—' : t('report.screens_per_session', { n: first.value })}</Text>;
        }
        return (
          <>
            <Text style={[facText.stat, { color: colors.fac.ink }]}>
              {first.value === null ? t('report.not_enough_samples') : t('report.seconds', { n: first.value })}
            </Text>
            <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{t('report.latency_caution')}</Text>
          </>
        );
      }

      case 'planningIdea':
        return (
          <Card body={idea?.text}>
            <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{t('report.idea_footer')}</Text>
          </Card>
        );

      case 'goals': {
        const items = (first?.detail as { goalId: string; title: string; target: number; targetPeriod: string; achieved: number | null }[] | undefined) ?? [];
        if (items.length === 0) return <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('report.no_goals')}</Text>;
        return (
          <View style={{ gap: space.s12 }}>
            {items.map((g) => {
              const label =
                g.achieved === null
                  ? t('report.goal_no_entry')
                  : t('report.goal_progress', { achieved: g.achieved, target: g.target, period: t(`goals.period_${g.targetPeriod}`) });
              return (
                <View key={g.goalId} style={{ gap: space.s4 }}>
                  <MixedText text={g.title} style={facText.bodyStrong} color={colors.fac.ink} />
                  <ProgressBar value={g.achieved === null ? 0 : g.achieved / g.target} accessibilityLabel={label} />
                  <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{label}</Text>
                </View>
              );
            })}
          </View>
        );
      }

      case 'notes': {
        const notes = (first?.detail as { sessionId: string; text: string }[] | undefined) ?? [];
        if (notes.length === 0) return <Text style={[facText.body, { color: colors.fac.inkMuted }]}>{t('report.no_notes')}</Text>;
        return (
          <View style={{ gap: space.s8 }}>
            {notes.map((n) => (
              <Text key={n.sessionId} style={[facText.body, { color: colors.fac.ink }]}>
                {n.text}
              </Text>
            ))}
          </View>
        );
      }

      default:
        return null;
    }
  })();

  return (
    <View style={styles.section} testID={`section-${section.id}`}>
      <SectionHeader kind="report" title={t(section.titleKey)} subtitle={subtitle} />
      {body}
    </View>
  );
}

function Locked({ n }: { n: number }) {
  const { colors } = useTheme();
  return <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{lockedLine(n)}</Text>;
}

function PairCard({ label, value }: { label: string; value: number | null | undefined }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pairCard, { backgroundColor: colors.fac.surface, borderColor: colors.fac.border }]}>
      <Text style={[facText.caption, { color: colors.fac.inkMuted }]}>{label}</Text>
      <Text style={[facText.stat, { color: colors.fac.ink }]}>
        {value === null || value === undefined ? '—' : t('report.seconds', { n: value })}
      </Text>
    </View>
  );
}

function subtitleFor(section: ReportSection, results: Results): string | undefined {
  if (!section.subtitleKey) return undefined;
  const first = results[section.measures[0] ?? ''];
  if (section.id === 'functions' && first?.detail) {
    const d = first.detail as { tagged: number; total: number };
    return t(section.subtitleKey, { tagged: d.tagged, total: d.total, notRecorded: first.notRecorded ?? 0 });
  }
  if (section.id === 'combinations' && first?.detail) {
    const d = first.detail as { built: number; stored: number; averageSymbols: number };
    return t(section.subtitleKey, { built: d.built, stored: d.stored, avg: d.averageSymbols.toFixed(1) });
  }
  if (section.subtitleKey.includes('{')) return undefined;
  return t(section.subtitleKey);
}

interface Row {
  label: string;
  value: number;
  valueLabel: string;
  max?: number;
}

function barRows(section: ReportSection, results: Results): Row[] {
  if (section.id === 'functions') {
    const d = (results.functions?.detail ?? {}) as Record<string, number>;
    return (['requesting', 'refusing', 'commenting', 'greeting'] as const).map((k) => ({
      label: t(`report.${k}`),
      value: d[k] ?? 0,
      valueLabel: String(d[k] ?? 0),
    }));
  }
  if (section.id === 'independence') {
    const d = (results.class_prompted_vs_independent?.detail ?? { independent: 0, prompted: 0 }) as { independent: number; prompted: number };
    return [
      { label: t('report.independent'), value: d.independent, valueLabel: String(d.independent) },
      { label: t('report.prompted'), value: d.prompted, valueLabel: String(d.prompted) },
    ];
  }
  // interaction pattern: percentages
  return section.measures.map((id) => {
    const r = results[id];
    const key = id === 'corrections' ? 'report.corrections_row' : id === 'repeated_taps' ? 'report.repeated_row' : 'report.abandoned_row';
    return { label: t(key), value: r?.value ?? 0, valueLabel: r?.locked ? '—' : r?.value === null || r?.value === undefined ? '—' : `${r.value}%`, max: 100 };
  });
}

const styles = StyleSheet.create({
  section: { gap: space.s12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s8 },
  seq: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, padding: space.s12 },
  pair: { flexDirection: 'row', gap: space.s12 },
  pairCard: { flex: 1, borderWidth: 1, borderRadius: radius.md, padding: space.s12, gap: space.s4 },
});
