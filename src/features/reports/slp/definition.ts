import type { ReportDefinition } from '../shared/types';

export const slpDefinition: ReportDefinition = {
  role: 'slp',
  titleKey: 'report.slp.title',
  subtitleKey: 'report.slp.subtitle',
  glance: ['independent_starts', 'prompt_dependency', 'words_used', 'needed_repair'],
  glanceLabelKeys: { words_used: 'measure.words_used.slp' },
  sections: [
    { id: 'functions', kind: 'barRows', titleKey: 'report.slp.functions.title', subtitleKey: 'report.parent.functions.subtitle', measures: ['functions'] },
    { id: 'combinations', kind: 'combinations', titleKey: 'report.slp.combinations.title', subtitleKey: 'report.slp.combinations.subtitle', measures: ['combinations'] },
    { id: 'vocabChange', kind: 'metricPair', titleKey: 'report.slp.vocabChange.title', measures: ['new_words', 'vocabulary_retention'] },
    { id: 'latency', kind: 'latencyCard', titleKey: 'report.slp.latency.title', measures: ['response_latency'] },
    { id: 'timeOfDay', kind: 'barChart', titleKey: 'report.parent.timeOfDay.title', measures: ['time_of_day'] },
    { id: 'goals', kind: 'goals', titleKey: 'goals.title', measures: ['goals'] },
  ],
};
