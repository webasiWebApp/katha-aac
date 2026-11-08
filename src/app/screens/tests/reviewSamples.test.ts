import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { makeTestDb } from '@/app/testing/testDb';
import { clearRoleMeasures, getMeasures } from '@/features/analytics/index';
import { allReportDefinitions, periodFor, registerReportMeasures } from '@/features/reports/index';
import { loadDemoData } from '@/features/settings/index';
import { buildReportHtml } from '@/features/share/index';

// Run with GEN_REVIEW=1 to (re)write docs/review/sample-<role>.html (open in a browser, print to PDF).
const run = process.env.GEN_REVIEW === '1' ? it : it.skip;

run('writes one sample report per role from the demonstration data (T-173)', async () => {
  const db = await makeTestDb();
  clearRoleMeasures();
  registerReportMeasures();
  loadDemoData(db);
  const dir = join(__dirname, '../../../../docs/review');
  mkdirSync(dir, { recursive: true });
  for (const def of allReportDefinitions()) {
    const ids = [...new Set(['sessions', ...def.glance, ...def.sections.flatMap((s) => s.measures)])];
    const results = getMeasures(db, { learnerId: 'L1', period: periodFor('7d'), role: def.role, ids: ids as never });
    const html = buildReportHtml(def, results, {
      learnerName: 'Demo Learner',
      code: 'P-07',
      period: periodFor('7d'),
      generatedOn: new Date().toISOString().slice(0, 10),
      fictional: true,
    });
    writeFileSync(join(dir, `sample-${def.role}.html`), html, 'utf8');
  }
});
