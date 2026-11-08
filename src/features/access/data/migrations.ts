import type { Migration } from '@/core/types/manifest';

export const migrations: Migration[] = [
  {
    id: '010_access',
    up: async (db) => {
      db.run(`CREATE TABLE learners (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        participant_code TEXT NOT NULL,
        is_fictional INTEGER NOT NULL DEFAULT 1,
        hand TEXT NOT NULL DEFAULT 'right' CHECK (hand IN ('right','left')),
        grid_size TEXT NOT NULL DEFAULT '3x4' CHECK (grid_size IN ('3x4','4x5','5x6')),
        idle_return_seconds INTEGER NOT NULL DEFAULT 30,
        reduced_motion INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      db.run(`CREATE TABLE consent (
        learner_id TEXT PRIMARY KEY REFERENCES learners(id),
        guardian_consent_at TEXT,
        research_logging INTEGER NOT NULL DEFAULT 0,
        withdrawn_at TEXT,
        updated_at TEXT NOT NULL
      )`);
      db.run(`CREATE TABLE role_permissions (
        role TEXT PRIMARY KEY CHECK (role IN ('parent','slp','educator','ot')),
        can_open_report INTEGER NOT NULL,
        can_see_history INTEGER NOT NULL,
        can_export INTEGER NOT NULL,
        can_enter_observations INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      const now = new Date().toISOString();
      const rows: [string, number, number, number, number][] = [
        ['parent', 1, 1, 1, 1],
        ['slp', 1, 1, 1, 1],
        ['educator', 1, 0, 0, 1],
        ['ot', 1, 0, 0, 1],
      ];
      for (const r of rows) {
        db.run('INSERT INTO role_permissions VALUES (?, ?, ?, ?, ?, ?)', [...r, now]);
      }
    },
  },
];
