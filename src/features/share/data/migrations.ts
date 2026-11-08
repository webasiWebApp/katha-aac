import type { Migration } from '@/core/types/manifest';

export const migrations: Migration[] = [
  {
    id: '070_share',
    up: async (db) => {
      db.run(`CREATE TABLE report_exports (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        destination TEXT NOT NULL CHECK (destination IN ('save','share','print')),
        consent_at TEXT NOT NULL,
        exported_at TEXT NOT NULL
      )`);
    },
  },
];
