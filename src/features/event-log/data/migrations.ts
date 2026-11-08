import type { Migration } from '@/core/types/manifest';

export const migrations: Migration[] = [
  {
    id: '040_event_log',
    up: async (db) => {
      db.run(`CREATE TABLE communication_events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES app_sessions(id),
        learner_id TEXT NOT NULL REFERENCES learners(id),
        type TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        at TEXT NOT NULL,
        offset_min INTEGER NOT NULL,
        symbol_id TEXT,
        draft_id TEXT,
        message_id TEXT,
        source TEXT CHECK (source IN ('grid','core','quick','template') OR source IS NULL),
        page_id TEXT,
        payload_json TEXT NOT NULL DEFAULT '{}'
      )`);
      db.run('CREATE INDEX idx_events_session_at ON communication_events(session_id, at)');
      db.run('CREATE INDEX idx_events_learner_at ON communication_events(learner_id, at)');
      db.run(`CREATE TABLE communication_attempts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES app_sessions(id),
        learner_id TEXT NOT NULL REFERENCES learners(id),
        draft_id TEXT UNIQUE,
        submitted_at TEXT NOT NULL,
        offset_min INTEGER NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('built','stored_phrase')),
        symbol_ids_json TEXT NOT NULL,
        text_snapshot TEXT NOT NULL,
        symbol_count INTEGER NOT NULL,
        template_id TEXT,
        vocabulary_version_id TEXT NOT NULL
      )`);
      db.run(
        'CREATE INDEX idx_attempts_learner_at ON communication_attempts(learner_id, submitted_at)',
      );
      db.run(`CREATE TABLE audio_attempts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES app_sessions(id),
        message_id TEXT,
        symbol_id TEXT,
        kind TEXT NOT NULL CHECK (kind IN ('word','message_first','message_replay')),
        requested_at TEXT NOT NULL,
        outcome TEXT NOT NULL CHECK (outcome IN ('clip','voice','failed','unsupported')),
        error_code TEXT
      )`);
    },
  },
];
