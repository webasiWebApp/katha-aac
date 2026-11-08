import { resetDatabase, openDatabase } from '@/core/db/__mocks__/sqliteMemory';
import { runMigrations } from '@/core/db/migrate';
import type { VocabularyContent } from '../domain/types';
import { validateVocabulary } from '../domain/validate';
import { manifest } from '../feature.manifest';
import {
  getActiveVocabulary,
  getActiveVocabularyId,
  getVocabularyById,
  installBundledVocabulary,
  isCore,
  categoryOf,
  getPage,
  getSymbol,
  resetVocabularyCache,
} from '../data/vocabularyRepo';
import seed from '../../../../assets/vocabulary/vocabulary-v1.json';
import manifestAudio from '../../../../assets/vocabulary/audio-manifest-v1.json';

const v1 = seed as unknown as VocabularyContent;
const clone = (): VocabularyContent => JSON.parse(JSON.stringify(v1)) as VocabularyContent;

describe('seed files', () => {
  it('has zero errors and unique ids', () => {
    expect(validateVocabulary(v1).errors).toEqual([]);
    expect(v1.symbols).toHaveLength(19);
  });
  it('audio manifest is empty', () => {
    expect(manifestAudio).toEqual({
      vocabularyVersion: 'v1',
      words: {},
      messages: {},
      phrases: {},
    });
  });
});

describe('validateVocabulary', () => {
  it('flags duplicate ids', () => {
    const c = clone();
    c.symbols.push({ ...c.symbols[0]! });
    expect(validateVocabulary(c).errors.join()).toContain('duplicate id');
  });
  it('flags unknown page cell', () => {
    const c = clone();
    c.pages[0]!.cells[0] = 'nope';
    expect(validateVocabulary(c).errors.join()).toContain('unknown id: nope');
  });
  it('flags unknown folder, core key, template refs', () => {
    const c = clone();
    c.folders.push({ symbolId: 'x', opensPage: 'y' });
    c.coreKeys.zzz = 'missing';
    c.templates[0]!.trigger = 'missing_trigger';
    const e = validateVocabulary(c).errors.join('|');
    expect(e).toContain('folder references unknown symbol');
    expect(e).toContain('folder opens unknown page');
    expect(e).toContain('core key zzz');
    expect(e).toContain('trigger unknown');
  });
  it('flags slot category with no symbol', () => {
    const c = clone();
    c.templates[0]!.slotCategories = ['describing'];
    c.symbols = c.symbols.filter((s) => s.category !== 'describing');
    c.pages[0]!.cells = c.pages[0]!.cells.map((x) => (x === 'sym_finished' ? null : x));
    c.storedPhrases = [];
    c.pages[1]!.cells = [];
    expect(validateVocabulary(c).errors.join()).toContain(
      'slot category has no symbol: describing',
    );
  });
  it('warns when last cell is not null and when pictogram missing', () => {
    const c = clone();
    c.pages[0]!.cells[11] = 'sym_me';
    const r = validateVocabulary(c, () => false);
    expect(r.warnings.join()).toContain('last cell is not null');
    expect(r.warnings.join()).toContain('missing pictogram');
  });
});

describe('vocabulary repository', () => {
  beforeEach(() => {
    resetDatabase();
    resetVocabularyCache();
  });
  it('installs once and is active', async () => {
    const db = openDatabase('t');
    await runMigrations(db, [manifest]);
    installBundledVocabulary(db, v1);
    installBundledVocabulary(db, v1);
    expect(db.all('SELECT * FROM vocabulary_versions')).toHaveLength(1);
    expect(getActiveVocabularyId(db)).toBe('v1');
    const v = getActiveVocabulary(db);
    expect(isCore(v, 'sym_help')).toBe(true);
    expect(isCore(v, 'sym_me')).toBe(false);
    expect(categoryOf(v, 'sym_water')).toBe('thing');
    expect(getPage(v, 'home')?.cells).toHaveLength(12);
    expect(getSymbol(v, 'nope')).toBeUndefined();
  });
  it('switches active version but keeps old', async () => {
    const db = openDatabase('t');
    await runMigrations(db, [manifest]);
    installBundledVocabulary(db, v1);
    installBundledVocabulary(db, { ...clone(), id: 'v2', label: 'v2' });
    expect(getActiveVocabularyId(db)).toBe('v2');
    expect(getVocabularyById(db, 'v1').id).toBe('v1');
    expect(() => getVocabularyById(db, 'zzz')).toThrow();
  });
});
