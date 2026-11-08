import { randomUUID } from 'expo-crypto';

import type { Role } from '@/core/types/common';
import type { Db, Migration } from '@/core/types/manifest';

export const migrations: Migration[] = [
  {
    id: '060_goals',
    up: async (db) => {
      db.run(`CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        learner_id TEXT NOT NULL REFERENCES learners(id),
        title TEXT NOT NULL,
        set_by_role TEXT NOT NULL,
        target_count INTEGER NOT NULL,
        target_period TEXT NOT NULL CHECK (target_period IN ('week','month','term')),
        visible_to_roles_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        archived_at TEXT
      )`);
      db.run(`CREATE TABLE goal_progress (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL REFERENCES goals(id),
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        achieved_count INTEGER NOT NULL,
        note TEXT,
        entered_by_role TEXT NOT NULL,
        entered_at TEXT NOT NULL
      )`);
    },
  },
];

export type TargetPeriod = 'week' | 'month' | 'term';

export interface Goal {
  id: string;
  learner_id: string;
  title: string;
  set_by_role: string;
  target_count: number;
  target_period: TargetPeriod;
  visible_to_roles: Role[];
  created_at: string;
  archived_at: string | null;
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  period_start: string;
  period_end: string;
  achieved_count: number;
  note: string | null;
  entered_by_role: string;
  entered_at: string;
}

export interface GoalWithProgress extends Goal {
  progress: GoalProgress[];
}

interface GoalRow extends Omit<Goal, 'visible_to_roles'> {
  visible_to_roles_json: string;
}

function toGoal(r: GoalRow): Goal {
  const { visible_to_roles_json, ...rest } = r;
  return { ...rest, visible_to_roles: JSON.parse(visible_to_roles_json) as Role[] };
}

export function createGoal(
  db: Db,
  a: { learnerId: string; title: string; role: Role; targetCount: number; targetPeriod: TargetPeriod; visibleTo: Role[] },
): string {
  if (a.title.trim() === '' || a.targetCount < 1) throw new Error('invalid_goal');
  const id = randomUUID();
  db.run(
    `INSERT INTO goals (id, learner_id, title, set_by_role, target_count, target_period, visible_to_roles_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, a.learnerId, a.title.trim(), a.role, a.targetCount, a.targetPeriod, JSON.stringify(a.visibleTo), new Date().toISOString()],
  );
  return id;
}

export function updateGoal(
  db: Db,
  id: string,
  patch: Partial<{ title: string; targetCount: number; targetPeriod: TargetPeriod; visibleTo: Role[] }>,
): void {
  const row = db.get<GoalRow>('SELECT * FROM goals WHERE id = ?', [id]);
  if (!row) throw new Error('goal_not_found');
  const g = toGoal(row);
  const title = (patch.title ?? g.title).trim();
  const target = patch.targetCount ?? g.target_count;
  if (title === '' || target < 1) throw new Error('invalid_goal');
  db.run(
    'UPDATE goals SET title = ?, target_count = ?, target_period = ?, visible_to_roles_json = ? WHERE id = ?',
    [title, target, patch.targetPeriod ?? g.target_period, JSON.stringify(patch.visibleTo ?? g.visible_to_roles), id],
  );
}

export function archiveGoal(db: Db, id: string): void {
  db.run('UPDATE goals SET archived_at = ? WHERE id = ?', [new Date().toISOString(), id]);
}

export function addProgress(
  db: Db,
  a: { goalId: string; periodStart: string; periodEnd: string; achievedCount: number; note?: string; role: Role },
): string {
  if (a.achievedCount < 0) throw new Error('invalid_progress');
  const id = randomUUID();
  db.run(
    `INSERT INTO goal_progress (id, goal_id, period_start, period_end, achieved_count, note, entered_by_role, entered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, a.goalId, a.periodStart, a.periodEnd, a.achievedCount, a.note ?? null, a.role, new Date().toISOString()],
  );
  return id;
}

/** Active goals whose visible-to list includes the role (parent sees every goal). */
export function listGoals(db: Db, learnerId: string, role: Role): GoalWithProgress[] {
  const rows = db.all<GoalRow>(
    'SELECT * FROM goals WHERE learner_id = ? AND archived_at IS NULL ORDER BY created_at',
    [learnerId],
  );
  return rows
    .map(toGoal)
    .filter((g) => role === 'parent' || g.visible_to_roles.includes(role))
    .map((g) => ({
      ...g,
      progress: db.all<GoalProgress>('SELECT * FROM goal_progress WHERE goal_id = ? ORDER BY entered_at', [g.id]),
    }));
}
