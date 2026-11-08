// Public API of the share feature. Other features import ONLY from here.
export { ShareScreen, type ExportFn } from './ui/ShareScreen';
export { buildReportHtml, type ReportMeta } from './domain/reportHtml';
export { logExport, mayExport, type Destination } from './data/exportRepo';
