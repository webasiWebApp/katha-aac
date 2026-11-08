import type { ReportDefinition } from '../shared/types';

export const otDefinition: ReportDefinition = {
  role: 'ot',
  titleKey: 'report.ot.title',
  subtitleKey: 'report.ot.subtitle',
  glance: ['session_length', 'corrections', 'repeated_taps', 'abandoned'],
  glanceLabelKeys: { session_length: 'measure.session_length.ot' },
  sections: [
    { id: 'access', kind: 'metricPair', titleKey: 'report.ot.access.title', subtitleKey: 'report.ot.access.subtitle', measures: ['latency_within_session'] },
    { id: 'interaction', kind: 'barRows', titleKey: 'report.ot.interaction.title', measures: ['corrections', 'repeated_taps', 'abandoned'] },
    { id: 'pages', kind: 'latencyCard', titleKey: 'report.ot.pages.title', measures: ['pages_per_session'] },
    { id: 'setup', kind: 'notes', titleKey: 'report.ot.setup.title', measures: ['setup_notes'] },
    { id: 'goals', kind: 'goals', titleKey: 'goals.title', measures: ['goals'] },
  ],
};
