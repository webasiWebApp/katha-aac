import type { WordCategory } from '@/core/types/common';

export interface VocabSymbol {
  id: string;
  label: string;
  gloss: string;
  category: WordCategory;
  isCore: boolean;
  pictogram: string;
  kind: 'word' | 'nav';
}
export interface StoredPhrase {
  id: string;
  label: string;
  gloss: string;
  pictogram: string;
}
export interface VocabPage {
  id: string;
  title: string;
  cells: (string | null)[];
}
export interface VocabFolder {
  symbolId: string;
  opensPage: string;
}
export interface VocabTemplate {
  id: string;
  trigger: string;
  pattern: string[];
  slotCategories: WordCategory[];
  display: string;
}
export interface VocabularyContent {
  id: string;
  label: string;
  language: string;
  symbols: VocabSymbol[];
  storedPhrases: StoredPhrase[];
  pages: VocabPage[];
  folders: VocabFolder[];
  coreKeys: Record<string, string>;
  templates: VocabTemplate[];
}
