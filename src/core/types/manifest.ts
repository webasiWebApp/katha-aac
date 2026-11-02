/**
 * Core types for feature manifests.
 * Db interface must match the implementation in @/core/db/database (T-012).
 * ReportDefinition must match @/features/reports/shared/types (T-130).
 */

export interface Db {
  run(sql: string, params?: unknown[]): void;
  get<T>(sql: string, params?: unknown[]): T | undefined;
  all<T>(sql: string, params?: unknown[]): T[];
  tx<T>(fn: (db: Db) => T): T;
}

export interface Migration {
  id: string;
  up: (db: Db) => Promise<void>;
}

// Placeholder — real type defined in features/reports/shared/types (T-130)
export type ReportDefinition = unknown;

export interface FeatureManifest {
  id: string;
  migrations?: Migration[];
  eventHandlers?: { event: string; handle: (payload: unknown) => Promise<void> }[];
  reportDefinitions?: ReportDefinition[];
}
