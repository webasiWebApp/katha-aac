import { allReportDefinitions } from '@/features/reports/index';
export { loadDemoData } from '@/features/settings/index';

export function getAllReportDefinitionsForTest() {
  return allReportDefinitions();
}
