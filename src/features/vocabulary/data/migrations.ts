import type { Migration } from '@/core/types/manifest';

export const migrations: Migration[] = [
  {
    id: '020_vocabulary_versions',
    up: async (db) => {
      db.run(`CREATE TABLE vocabulary_versions (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        content_json TEXT NOT NULL,
        installed_at TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0
      )`);
    },
  },
];
