import { getOrCreateDbKey, openDatabase, prepareDatabase } from '@/core/db';
import { initErrorLog, installGlobalErrorHandler } from '@/core/log';
import type { Db } from '@/core/types/manifest';
import { closeOrphanSession } from '@/features/sessions/index';
import { bootFeatures } from './registry/featureRegistry';

export const APP_VERSION = '1.0.0';

/** Opens the encrypted DB, runs migrations, and applies boot rule 2 (end an orphaned session). */
export async function bootApp(): Promise<Db> {
  const key = await getOrCreateDbKey();
  await prepareDatabase('katha.db');
  const db = openDatabase('katha.db', key);
  initErrorLog(db, APP_VERSION);
  installGlobalErrorHandler();
  await bootFeatures(db);
  closeOrphanSession(db);
  return db;
}
