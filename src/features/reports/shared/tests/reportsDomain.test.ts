import { en } from '@/core/i18n/en';
import { t } from '@/core/i18n/t';
import { aggregateReports, roleReportManifests } from '../../feature.manifest';
import { educatorDefinition } from '../../educator/definition';
import { otDefinition } from '../../ot/definition';
import { parentDefinition } from '../../parent/definition';
import { slpDefinition } from '../../slp/definition';
import { registry } from '@/features/analytics/index';
import { changeText, planningIdea } from '../planningIdeas';
import type { MeasureResult, ReportDefinition } from '../types';

const defs: ReportDefinition[] = [parentDefinition, slpDefinition, educatorDefinition, otDefinition];

const res = (id: string, value: number | null, detail?: unknown): MeasureResult => ({ id, value, locked: false, sessionsSoFar: 6, detail });

describe('report definitions (T-130)', () => {
  it.each(defs.map((d) => [d.role, d] as const))('%s only references registered measures and known i18n keys', (_r, d) => {
    const ids = [...d.glance, ...d.sections.flatMap((s) => s.measures)];
    for (const id of ids) expect(Object.keys(registry)).toContain(id);
    const keys = [d.titleKey, d.subtitleKey, ...d.sections.flatMap((s) => [s.titleKey, s.subtitleKey ?? '']), ...Object.values(d.glanceLabelKeys ?? {})].filter(Boolean);
    for (const k of keys) expect(Object.keys(en)).toContain(k);
    expect(d.glance).toHaveLength(4);
  });

  it('matches section 8.2 titles and glance', () => {
    expect(t(parentDefinition.titleKey)).toBe('Parent report');
    expect(parentDefinition.glance).toEqual(['messages_sent', 'words_used', 'independent_starts', 'confirmed_meant']);
    expect(slpDefinition.glance).toEqual(['independent_starts', 'prompt_dependency', 'words_used', 'needed_repair']);
    expect(educatorDefinition.glance).toEqual(['class_messages', 'class_help_requests', 'class_independent_starts', 'class_words']);
    expect(otDefinition.glance).toEqual(['session_length', 'corrections', 'repeated_taps', 'abandoned']);
    expect(parentDefinition.sections.map((s) => s.id)).toEqual(['words', 'functions', 'timeOfDay', 'idea', 'goals']);
    expect(otDefinition.sections.map((s) => s.id)).toEqual(['access', 'interaction', 'pages', 'setup', 'goals']);
  });

  it('the reports manifest aggregates one definition per role folder', () => {
    expect(aggregateReports(roleReportManifests).reportDefinitions).toHaveLength(4);
  });
});

describe('role isolation (T-138)', () => {
  it('removing the ot folder leaves the other definitions identical', () => {
    const without = aggregateReports(roleReportManifests.filter((m) => m.id !== 'reports-ot'));
    const full = aggregateReports(roleReportManifests);
    expect(without.reportDefinitions).toHaveLength(3);
    const roles = (without.reportDefinitions as ReportDefinition[]).map((d) => d.role);
    expect(roles).toEqual(['parent', 'slp', 'educator']);
    for (const d of without.reportDefinitions as ReportDefinition[]) {
      expect(JSON.stringify(d)).toBe(JSON.stringify((full.reportDefinitions as ReportDefinition[]).find((x) => x.role === d.role)));
    }
  });
});

describe('planning ideas (T-136)', () => {
  const tod = (m: number, a: number, e: number, n: number) => res('time_of_day', m + a + e + n, { morning: m, afternoon: a, evening: e, night: n });
  const words = res('words_used', 3, [
    { label: 'වතුර', category: 'thing', count: 3 },
    { label: 'කිරි', category: 'thing', count: 2 },
    { label: 'මට', category: 'people', count: 2 },
  ]);
  const base = { sessions: res('sessions', 6) };

  it('PI-P1 when a bucket has 40%+ and 2 thing words', () => {
    const r = planningIdea('parent', { ...base, time_of_day: tod(5, 3, 2, 0), words_used: words });
    expect(r?.id).toBe('PI-P1');
    expect(r?.text).toBe('Most messages were in the morning. You could offer a choice during morning activities, such as වතුර or කිරි.');
  });
  it('PI-P2 otherwise', () => {
    const r = planningIdea('parent', { ...base, time_of_day: tod(3, 3, 2, 2), words_used: words });
    expect(r?.id).toBe('PI-P2');
    expect(r?.text).toContain('වතුර and කිරි');
  });
  it('hidden with fewer than 5 sessions or no words', () => {
    expect(planningIdea('parent', { sessions: res('sessions', 4), words_used: words })).toBeNull();
    expect(planningIdea('parent', { ...base, words_used: res('words_used', 0, []) })).toBeNull();
  });
  it('PI-E1 then PI-E2 then hidden', () => {
    expect(planningIdea('educator', { ...base, class_help_requests: res('class_help_requests', 2), class_messages: res('class_messages', 4) })?.id).toBe('PI-E1');
    expect(planningIdea('educator', { ...base, class_help_requests: res('class_help_requests', 0), class_messages: res('class_messages', 4) })?.text).toBe(
      '4 messages were recorded in class. Consider planning one more chance to choose during each lesson.',
    );
    expect(planningIdea('educator', { ...base, class_help_requests: res('class_help_requests', 0), class_messages: res('class_messages', 0) })).toBeNull();
  });
  it('slp and ot have no planning idea', () => {
    expect(planningIdea('slp', { ...base, words_used: words })).toBeNull();
    expect(planningIdea('ot', { ...base, words_used: words })).toBeNull();
  });
});

describe('change wording', () => {
  it('uses only the three allowed phrasings', () => {
    expect(changeText(3, 7)).toBe('3 more than the previous 7 days');
    expect(changeText(-2, 7)).toBe('2 fewer than the previous 7 days');
    expect(changeText(0, 7)).toBe('the same as the previous 7 days');
  });
});

// T-137 wording guard
const BANNED = /\b(improv\w*|progress|plateau\w*|declin\w*|regress\w*|therapy working|diagnos\w*|delay\w*|deficit\w*|normal|abnormal|better|worse)\b/i;

function violations(strings: string[]): string[] {
  return strings.filter((s) => s !== 'Goals and progress' && BANNED.test(s));
}

describe('wording guard (T-137)', () => {
  it('no banned word in en.ts, report definitions or planning texts', () => {
    expect(violations(Object.values(en))).toEqual([]);
    const defStrings = defs.flatMap((d) => [d.titleKey, d.subtitleKey, ...d.sections.map((s) => s.titleKey)].map((k) => t(k)));
    expect(violations(defStrings)).toEqual([]);
  });
  it('the guard actually fails on "improved"', () => {
    expect(violations([...Object.values(en), 'Communication improved'])).toEqual(['Communication improved']);
    expect(violations(['There was a decline', 'a delay', 'abnormal results', 'the therapy working'])).toHaveLength(4);
  });
});
