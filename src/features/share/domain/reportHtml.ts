import { t } from '@/core/i18n/t';
import { formatPeriod } from '@/core/time';
import type { Period } from '@/core/types/common';
import { registry, type MeasureResult } from '@/features/analytics/index';
import { LIMITATION_TEXT, planningIdea, type ReportDefinition, type ReportSection } from '@/features/reports/index';

export interface ReportMeta {
  learnerName: string;
  code: string;
  period: Period;
  generatedOn: string; // YYYY-MM-DD
  fictional: boolean;
  enabledSections?: string[];
  /** @font-face CSS (base64 fonts) injected by the device layer (T-141). */
  fontCss?: string;
}

type Results = Record<string, MeasureResult | undefined>;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
@page { size: A4 portrait; margin: 16mm; }
body { font-family: 'Noto Sans', 'Noto Sans Sinhala', sans-serif; color: #1F2933; font-size: 11pt; }
h1 { font-size: 20pt; margin: 0 0 4px; } h2 { font-size: 14pt; margin: 18px 0 6px; }
.muted { color: #52606D; } .notice { border: 1px solid #E6C84F; background: #FFF8DB; padding: 8px; margin: 12px 0; }
table.glance { width: 100%; border-collapse: collapse; } table.glance td { border: 1px solid #D9D4CC; padding: 8px; width: 50%; vertical-align: top; }
.val { font-size: 18pt; font-weight: 700; } .barrow { display: flex; align-items: center; gap: 8px; margin: 3px 0; }
.bar { height: 12px; background: #3A6FF7; } .chip { display: inline-block; border: 1px solid #D9D4CC; border-radius: 12px; padding: 2px 10px; margin: 2px; }
.sample { color: #A86B00; font-weight: 700; } footer { margin-top: 24px; font-size: 9pt; color: #52606D; }
`;

function metricCell(label: string, r: MeasureResult | undefined): string {
  let body: string;
  if (!r) body = '—';
  else if (r.locked) body = esc(t('report.locked_list', { n: r.sessionsSoFar }));
  else if (r.numerator !== undefined && r.denominator !== undefined && r.denominator > 0) {
    body = `<span class="val">${r.value}%</span><br>${r.numerator} / ${r.denominator}`;
  } else body = `<span class="val">${r.value === null ? '—' : r.value}</span>`;
  return `<td><div class="muted">${esc(label)}</div>${body}</td>`;
}

function bars(rows: { label: string; value: number; max: number; text: string }[]): string {
  return rows
    .map(
      (r) =>
        `<div class="barrow"><span style="width:110px">${esc(r.label)}</span><div class="bar" style="width:${Math.round(
          (r.max > 0 ? r.value / r.max : 0) * 220,
        )}px"></div><span>${esc(r.text)}</span></div>`,
    )
    .join('');
}

function sectionHtml(s: ReportSection, results: Results, ideaText: string | null): string {
  const first = results[s.measures[0] ?? ''];
  const head = `<h2>${esc(t(s.titleKey))}</h2>`;
  const locked = first?.locked ? `<p class="muted">${esc(t('report.locked_list', { n: first.sessionsSoFar }))}</p>` : null;

  switch (s.kind) {
    case 'wordChips': {
      const words = ((first?.detail as { label: string; count: number }[] | undefined) ?? []).slice(0, 6);
      return head + words.map((w) => `<span class="chip">${esc(w.label)} ${w.count}</span>`).join('');
    }
    case 'barRows': {
      if (locked) return head + locked;
      if (s.id === 'functions') {
        const d = (first?.detail ?? {}) as Record<string, number>;
        const keys = ['requesting', 'refusing', 'commenting', 'greeting'] as const;
        const max = Math.max(1, ...keys.map((k) => d[k] ?? 0));
        return head + bars(keys.map((k) => ({ label: t(`report.${k}`), value: d[k] ?? 0, max, text: String(d[k] ?? 0) })));
      }
      if (s.id === 'independence') {
        const d = (results.class_prompted_vs_independent?.detail ?? { independent: 0, prompted: 0 }) as { independent: number; prompted: number };
        const max = Math.max(1, d.independent, d.prompted);
        return (
          head +
          bars([
            { label: t('report.independent'), value: d.independent, max, text: String(d.independent) },
            { label: t('report.prompted'), value: d.prompted, max, text: String(d.prompted) },
          ])
        );
      }
      return (
        head +
        bars(
          s.measures.map((id) => {
            const r = results[id];
            return { label: t(`measure.${id}`), value: r?.value ?? 0, max: 100, text: r?.locked || r?.value == null ? '—' : `${r.value}%` };
          }),
        )
      );
    }
    case 'barChart': {
      const d = (first?.detail ?? {}) as Record<string, number>;
      const keys = ['morning', 'afternoon', 'evening', 'night'];
      const max = Math.max(1, ...keys.map((k) => d[k] ?? 0));
      const rects = keys
        .map((k, i) => {
          const h = Math.round(((d[k] ?? 0) / max) * 80);
          return `<rect x="${20 + i * 70}" y="${100 - h}" width="40" height="${h}" fill="#3A6FF7"></rect><text x="${20 + i * 70}" y="114" font-size="10">${esc(t(`bucket.${k}`))}</text><text x="${24 + i * 70}" y="${96 - h}" font-size="10">${d[k] ?? 0}</text>`;
        })
        .join('');
      return `${head}<svg width="300" height="120" viewBox="0 0 300 120">${rects}</svg>`;
    }
    case 'lineChart': {
      const weeks = ((first?.detail as { weeks?: number[] } | undefined)?.weeks ?? []) as number[];
      const max = Math.max(1, ...weeks);
      const pts = weeks.map((v, i) => `${20 + i * 50},${100 - Math.round((v / max) * 80)}`).join(' ');
      return `${head}<svg width="300" height="120" viewBox="0 0 300 120"><polyline points="${pts}" fill="none" stroke="#3A6FF7" stroke-width="2"></polyline></svg>`;
    }
    case 'combinations': {
      const d = first?.detail as { top: { labels: string[]; count: number }[]; built: number; stored: number; averageSymbols: number } | undefined;
      const sub = d ? `<p class="muted">${esc(t('report.slp.combinations.subtitle', { built: d.built, stored: d.stored, avg: d.averageSymbols.toFixed(1) }))}</p>` : '';
      return head + sub + (d?.top ?? []).map((c) => `<div class="chip">${esc(c.labels.join(' + '))} · ${c.count}x</div>`).join('');
    }
    case 'metricPair': {
      if (s.measures[0] === 'latency_within_session') {
        const d = first?.detail as { first: number | null; last: number | null } | undefined;
        const f = (v: number | null | undefined) => (v === null || v === undefined ? '—' : t('report.seconds', { n: v }));
        return `${head}<p>${esc(t('report.first_3min'))}: ${esc(f(d?.first))}<br>${esc(t('report.last_3min'))}: ${esc(f(d?.last))}</p><p class="muted">${esc(t('report.ot.access.subtitle'))}</p>`;
      }
      return `${head}<table class="glance"><tr>${s.measures.map((id) => metricCell(t(`measure.${id}`), results[id])).join('')}</tr></table>`;
    }
    case 'latencyCard': {
      if (s.measures[0] === 'pages_per_session') {
        return `${head}<p class="val">${first?.value == null ? '—' : esc(t('report.screens_per_session', { n: first.value }))}</p>`;
      }
      return `${head}<p class="val">${first?.value == null ? esc(t('report.not_enough_samples')) : esc(t('report.seconds', { n: first.value }))}</p><p class="muted">${esc(t('report.latency_caution'))}</p>`;
    }
    case 'planningIdea':
      return ideaText ? `${head}<p>${esc(ideaText)}</p><p class="muted">${esc(t('report.idea_footer'))}</p>` : '';
    case 'goals': {
      const items = (first?.detail as { title: string; target: number; targetPeriod: string; achieved: number | null }[] | undefined) ?? [];
      if (items.length === 0) return `${head}<p class="muted">${esc(t('report.no_goals'))}</p>`;
      return (
        head +
        items
          .map((g) =>
            `<p>${esc(g.title)}<br><span class="muted">${esc(
              g.achieved === null ? t('report.goal_no_entry') : t('report.goal_progress', { achieved: g.achieved, target: g.target, period: t(`goals.period_${g.targetPeriod}`) }),
            )}</span></p>`,
          )
          .join('')
      );
    }
    case 'notes': {
      const notes = (first?.detail as { text: string }[] | undefined) ?? [];
      return head + (notes.length === 0 ? `<p class="muted">${esc(t('report.no_notes'))}</p>` : notes.map((n) => `<p>${esc(n.text)}</p>`).join(''));
    }
    default:
      return '';
  }
}

/** Pure: report definition + measure results -> self-contained A4 HTML (no external URLs). */
export function buildReportHtml(def: ReportDefinition, results: Results, meta: ReportMeta): string {
  const idea = planningIdea(def.role, results);
  const sections = def.sections.filter((s) => s.required || !meta.enabledSections || meta.enabledSections.includes(s.id));
  const sessions = results.sessions;
  const days = (sessions?.detail as { daysWithSessions: number } | undefined)?.daysWithSessions ?? 0;

  const glance = def.glance.map((id) => metricCell(t(def.glanceLabelKeys?.[id] ?? `measure.${id}`), results[id]));
  const glanceTable = `<table class="glance"><tr>${glance[0]}${glance[1]}</tr><tr>${glance[2]}${glance[3]}</tr></table>`;

  const used = new Set<string>(def.glance);
  for (const s of sections) s.measures.forEach((m) => used.add(m));
  const definitions = [...used]
    .filter((id) => id in registry)
    .map((id) => `<li><strong>${esc(t(`measure.${id}`))}</strong>: ${esc(registry[id as keyof typeof registry].definition)}</li>`)
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t(def.titleKey))}</title><style>${meta.fontCss ?? ''}${CSS}</style></head><body>
<h1>${esc(t(def.titleKey))}</h1>
<div>${esc(meta.learnerName)} · ${esc(meta.code)}${meta.fictional ? ` <span class="sample">${esc(t('common.sample_data'))}</span>` : ''}</div>
<div class="muted">${esc(formatPeriod(meta.period))} · ${esc(t('report.header.sessions', { sessions: sessions?.value ?? 0, days }))} · ${esc(meta.generatedOn)}</div>
<div class="notice">${esc(LIMITATION_TEXT)}</div>
<h2>${esc(t('report.glance'))}</h2><p class="muted">${esc(t(def.subtitleKey))}</p>${glanceTable}
${sections.map((s) => sectionHtml(s, results, idea?.text ?? null)).join('\n')}
<h2>${esc(t('share.definitions'))}</h2><ul>${definitions}</ul>
<footer>${esc(t('share.footer', { date: meta.generatedOn }))}${meta.fictional ? ` ${esc(t('common.sample_data'))}.` : ''}</footer>
</body></html>`;
}
