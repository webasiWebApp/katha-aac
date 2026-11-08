import type { Migration } from '@/core/types/manifest';

export const migrations: Migration[] = [
  {
    id: '030_sessions',
    up: async (db) => {
      db.run(`CREATE TABLE app_sessions (
        id TEXT PRIMARY KEY,
        learner_id TEXT NOT NULL REFERENCES learners(id),
        vocabulary_version_id TEXT NOT NULL REFERENCES vocabulary_versions(id),
        setting TEXT NOT NULL DEFAULT 'unknown' CHECK (setting IN ('home','school','therapy','unknown')),
        started_at TEXT NOT NULL,
        offset_min INTEGER NOT NULL,
        ended_at TEXT,
        end_reason TEXT CHECK (end_reason IN ('adult_exit','background_timeout','app_restart')),
        active_ms INTEGER NOT NULL DEFAULT 0,
        started_by_role TEXT NOT NULL
      )`);
      db.run(
        'CREATE INDEX idx_sessions_learner_start ON app_sessions(learner_id, started_at)',
      );
    },
  },
];
