import type { ReportDefinition } from '../shared/types';

export const parentDefinition: ReportDefinition = {
  role: 'parent',
  titleKey: 'report.parent.title',
  subtitleKey: 'report.parent.subtitle',
  glance: ['messages_sent', 'words_used', 'independent_starts', 'confirmed_meant'],
  glanceLabelKeys: { confirmed_meant: 'measure.confirmed_meant.parent' },
  sections: [
    { id: 'words', kind: 'wordChips', titleKey: 'report.parent.words.title', subtitleKey: 'report.parent.words.subtitle', measures: ['top_words', 'new_words'] },
    { id: 'functions', kind: 'barRows', titleKey: 'report.parent.functions.title', subtitleKey: 'report.parent.functions.subtitle', measures: ['functions'] },
    { id: 'timeOfDay', kind: 'barChart', titleKey: 'report.parent.timeOfDay.title', measures: ['time_of_day'] },
    { id: 'idea', kind: 'planningIdea', titleKey: 'report.idea.title', measures: ['planning_idea'] },
    { id: 'goals', kind: 'goals', titleKey: 'goals.title', measures: ['goals'] },
  ],
};
