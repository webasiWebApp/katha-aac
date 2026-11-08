import type { Db } from '@/core/types/manifest';
import type { WordCategory } from '@/core/types/common';
import type { VocabPage, VocabSymbol, VocabularyContent } from '../domain/types';

interface Row {
  id: string;
  content_json: string;
}

const cache = new Map<string, VocabularyContent>();

/** Installs the bundled version if its id is not yet present and marks it active. */
export function installBundledVocabulary(db: Db, bundled: VocabularyContent): void {
  const existing = db.get<{ id: string }>('SELECT id FROM vocabulary_versions WHERE id = ?', [
    bundled.id,
  ]);
  if (existing) return;
  db.tx((t) => {
    t.run('UPDATE vocabulary_versions SET is_active = 0');
    t.run(
      `INSERT INTO vocabulary_versions (id, label, content_json, installed_at, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [bundled.id, bundled.label, JSON.stringify(bundled), new Date().toISOString()],
    );
  });
  cache.clear();
}

export function getActiveVocabularyId(db: Db): string {
  const row = db.get<{ id: string }>('SELECT id FROM vocabulary_versions WHERE is_active = 1');
  if (!row) throw new Error('no active vocabulary');
  return row.id;
}

export function getVocabularyById(db: Db, id: string): VocabularyContent {
  const hit = cache.get(id);
  if (hit) return hit;
  const row = db.get<Row>('SELECT id, content_json FROM vocabulary_versions WHERE id = ?', [id]);
  if (!row) throw new Error(`vocabulary not found: ${id}`);
  const content = JSON.parse(row.content_json) as VocabularyContent;
  cache.set(id, content);
  return content;
}

export function getActiveVocabulary(db: Db): VocabularyContent {
  return getVocabularyById(db, getActiveVocabularyId(db));
}

export function resetVocabularyCache(): void {
  cache.clear();
}

export function getSymbol(v: VocabularyContent, id: string): VocabSymbol | undefined {
  return v.symbols.find((s) => s.id === id);
}
export function getPage(v: VocabularyContent, id: string): VocabPage | undefined {
  return v.pages.find((p) => p.id === id);
}
export function isCore(v: VocabularyContent, id: string): boolean {
  return getSymbol(v, id)?.isCore ?? false;
}
export function categoryOf(v: VocabularyContent, id: string): WordCategory | undefined {
  return getSymbol(v, id)?.category;
}
