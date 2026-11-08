import type { ReportDefinition } from '../shared/types';

export const educatorDefinition: ReportDefinition = {
  role: 'educator',
  titleKey: 'report.educator.title',
  subtitleKey: 'report.educator.subtitle',
  glance: ['class_messages', 'class_help_requests', 'class_independent_starts', 'class_words'],
  glanceLabelKeys: { class_words: 'measure.class_words.glance' },
  sections: [
    { id: 'classWords', kind: 'wordChips', titleKey: 'report.educator.classWords.title', measures: ['class_words'] },
    { id: 'independence', kind: 'barRows', titleKey: 'report.educator.independence.title', measures: ['class_prompted_vs_independent'] },
    { id: 'weekly', kind: 'lineChart', titleKey: 'report.educator.weekly.title', measures: ['class_messages_weekly'] },
    { id: 'idea', kind: 'planningIdea', titleKey: 'report.idea.title', measures: ['planning_idea'] },
    { id: 'goals', kind: 'goals', titleKey: 'goals.title', measures: ['goals'] },
  ],
};
