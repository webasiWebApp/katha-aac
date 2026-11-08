import type { VocabularyContent } from '../domain/types';

 
const raw = require('../../../../assets/vocabulary/vocabulary-v1.json') as VocabularyContent;
export const bundledVocabulary: VocabularyContent = raw;
