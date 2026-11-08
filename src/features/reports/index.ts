// Public API of the reports feature. Other features import ONLY from here.
export { ReportScreen, DashboardScreen, BuilderScreen, HistoryScreen } from './ui/ReportScreens';
export { ReportView, type ReportViewProps } from './ui/ReportView';
export { useReport, usePeriod, periodFor, todayLocal, type PickerPreset } from './ui/useReport';
export {
  allReportDefinitions,
  getReportDefinition,
  measureIdsOf,
  registerReportMeasures,
} from './registry';
export { planningIdea, changeText, type PlanningIdea } from './shared/planningIdeas';
export type { ReportDefinition, ReportSection, SectionKind, MeasureResult } from './shared/types';
export { LIMITATION_TEXT } from './shared/limitation';
