import type { Role } from '@/core/types/common';
import type { Db } from '@/core/types/manifest';

export interface RolePermission {
  canOpenReport: boolean;
  canSeeHistory: boolean;
  canExport: boolean;
  canEnterObservations: boolean;
}
export type PermissionMap = Record<Role, RolePermission>;

export type Resource =
  | `report:${Role}`
  | 'history'
  | 'export'
  | 'observations:enter'
  | 'admin';

export const ROLES: Role[] = ['parent', 'slp', 'educator', 'ot'];

export const DEFAULT_PERMISSIONS: PermissionMap = {
  parent: { canOpenReport: true, canSeeHistory: true, canExport: true, canEnterObservations: true },
  slp: { canOpenReport: true, canSeeHistory: true, canExport: true, canEnterObservations: true },
  educator: { canOpenReport: true, canSeeHistory: false, canExport: false, canEnterObservations: true },
  ot: { canOpenReport: true, canSeeHistory: false, canExport: false, canEnterObservations: true },
};

/** Pure permission check (section 10, T-093). */
export function canView(role: Role | null, resource: Resource, perms: PermissionMap): boolean {
  if (!role) return false;
  const p = perms[role];
  if (resource === 'admin') return role === 'parent';
  if (resource === 'history') return p.canSeeHistory;
  if (resource === 'export') return p.canExport;
  if (resource === 'observations:enter') return p.canEnterObservations;
  if (resource.startsWith('report:')) {
    const target = resource.slice('report:'.length) as Role;
    return p.canOpenReport && (role === target || role === 'parent');
  }
  return false;
}

interface PermRow {
  role: Role;
  can_open_report: number;
  can_see_history: number;
  can_export: number;
  can_enter_observations: number;
}

export function loadPermissions(db: Db): PermissionMap {
  const map: PermissionMap = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)) as PermissionMap;
  for (const r of db.all<PermRow>('SELECT * FROM role_permissions')) {
    map[r.role] = {
      canOpenReport: r.can_open_report === 1,
      canSeeHistory: r.can_see_history === 1,
      canExport: r.can_export === 1,
      canEnterObservations: r.can_enter_observations === 1,
    };
  }
  return map;
}

/** Parent only. Throws for anyone else. */
export function savePermission(
  db: Db,
  actor: Role | null,
  target: Role,
  patch: Partial<RolePermission>,
): void {
  if (actor !== 'parent') throw new Error('not_allowed');
  const cur = loadPermissions(db)[target];
  const next = { ...cur, ...patch };
  db.run(
    `UPDATE role_permissions SET can_open_report = ?, can_see_history = ?, can_export = ?,
       can_enter_observations = ?, updated_at = ? WHERE role = ?`,
    [
      next.canOpenReport ? 1 : 0,
      next.canSeeHistory ? 1 : 0,
      next.canExport ? 1 : 0,
      next.canEnterObservations ? 1 : 0,
      new Date().toISOString(),
      target,
    ],
  );
}
