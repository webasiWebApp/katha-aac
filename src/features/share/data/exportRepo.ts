import { randomUUID } from 'expo-crypto';

import type { Period, Role } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';
import { canView, loadPermissions } from '@/features/access/index';

export type Destination = 'save' | 'share' | 'print';

/** Records that a report left the device (no report content is stored). */
export function logExport(
  db: Db,
  a: { role: Role; period: Period; destination: Destination; consentAt: string; exportedAt?: string },
): string {
  const id = randomUUID();
  db.run(
    `INSERT INTO report_exports (id, role, period_start, period_end, destination, consent_at, exported_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, a.role, a.period.start, a.period.end, a.destination, a.consentAt, a.exportedAt ?? new Date().toISOString()],
  );
  return id;
}

/** A role may export only if it has the export permission AND may open that report. */
export function mayExport(db: Db, actor: Role | null, report: Role): boolean {
  const perms = loadPermissions(db);
  return canView(actor, 'export', perms) && canView(actor, `report:${report}`, perms);
}
