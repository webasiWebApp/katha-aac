import { openDatabase, resetDatabase } from '@/core/db/__mocks__/sqliteMemory';
import { runMigrations } from '@/core/db/migrate';
import type { Db, FeatureManifest } from '@/core/types/manifest';
import { bundledVocabulary, installBundledVocabulary, resetVocabularyCache } from '@/features/vocabulary/index';
import { featureRegistry } from '@/app/registry/featureRegistry';

export const TEST_LEARNER = 'L1';

/** Fresh in-memory DB with every migration applied, seed vocabulary and learner L1 (test only). */
export async function makeTestDb(manifests: FeatureManifest[] = featureRegistry): Promise<Db> {
  resetDatabase();
  resetVocabularyCache();
  const db = openDatabase('test');
  await runMigrations(db, manifests);
  installBundledVocabulary(db, bundledVocabulary);
  const now = '2026-10-01T00:00:00.000Z';
  db.run(
    `INSERT INTO learners (id, display_name, participant_code, is_fictional, created_at, updated_at)
     VALUES (?, 'Demo Learner', 'P-07', 1, ?, ?)`,
    [TEST_LEARNER, now, now],
  );
  return db;
}
