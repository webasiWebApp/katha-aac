import type { Migration } from '@/core/types/manifest';

export const migrations: Migration[] = [
  {
    id: '050_observations',
    up: async (db) => {
      db.run(`CREATE TABLE observations (
        id TEXT PRIMARY KEY,
        learner_id TEXT NOT NULL REFERENCES learners(id),
        session_id TEXT NOT NULL REFERENCES app_sessions(id),
        message_id TEXT REFERENCES communication_attempts(id),
        kind TEXT NOT NULL CHECK (kind IN ('intent','function','prompting','breakdown','opportunities','setup_note')),
        value TEXT NOT NULL,
        count_a INTEGER,
        count_b INTEGER,
        entered_by_role TEXT NOT NULL,
        entered_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (message_id, kind),
        UNIQUE (session_id, kind, message_id)
      )`);
    },
  },
];
