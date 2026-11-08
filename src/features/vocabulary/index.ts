// Public API of the vocabulary feature. Other features import ONLY from here.
export { Pictogram, pictogramNames, type PictogramName, type PictogramProps } from './ui/Pictogram';
export type {
  VocabSymbol,
  StoredPhrase,
  VocabPage,
  VocabTemplate,
  VocabularyContent,
} from './domain/types';
export { validateVocabulary, type ValidationResult } from './domain/validate';
export {
  installBundledVocabulary,
  getActiveVocabulary,
  getActiveVocabularyId,
  getVocabularyById,
  getSymbol,
  getPage,
  isCore,
  categoryOf,
  resetVocabularyCache,
} from './data/vocabularyRepo';
export { bundledVocabulary } from './data/bundled';
export { VocabularyScreen } from './ui/VocabularyScreen';
