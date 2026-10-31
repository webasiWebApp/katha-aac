// SAMPLE DATA for the dev-only component gallery. Not from Figma and not real vocabulary:
// the word-class assignments and chart numbers are illustrative so every state can be shown.
import type { WordKey } from '@/core/i18n';
import type { WordClass } from '@/features/board';
import type { PictogramName } from '@/features/vocabulary';

export interface SampleWord {
  key: WordKey;
  pictogram: PictogramName;
  wordClass: WordClass;
}

const w = (key: WordKey, wordClass: WordClass): SampleWord => ({ key, pictogram: key, wordClass });

export const sampleWords: Record<WordKey, SampleWord> = {
  me: w('me', 'core'),
  want: w('want', 'core'),
  more: w('more', 'core'),
  stop: w('stop', 'core'),
  help: w('help', 'core'),
  yes: w('yes', 'core'),
  no: w('no', 'core'),
  finished: w('finished', 'describing'),
  eat: w('eat', 'action'),
  drink: w('drink', 'action'),
  go: w('go', 'action'),
  play: w('play', 'action'),
  bathe: w('bathe', 'action'),
  sleep: w('sleep', 'action'),
  toilet: w('toilet', 'thing'),
  happy: w('happy', 'describing'),
  sad: w('sad', 'describing'),
  hurts: w('hurts', 'describing'),
  water: w('water', 'thing'),
  milk: w('milk', 'thing'),
  kiribath: w('kiribath', 'thing'),
  kottu: w('kottu', 'thing'),
  rice: w('rice', 'thing'),
  hoppers: w('hoppers', 'thing'),
  amma: w('amma', 'people'),
  thaththa: w('thaththa', 'people'),
  achchi: w('achchi', 'people'),
  teacher: w('teacher', 'people'),
  school: w('school', 'thing'),
  bus: w('bus', 'thing'),
};

export const noop = () => undefined;

// Chart numbers: illustrative only (the Figma chart numbers are sample content too).
export const learningCurve = {
  yTicks: [0, 2, 4, 6, 8].map((v) => ({ value: v, label: `${v} s` })),
  a: [7.2, 6.4, 5.6, 5.3, 4.9, 4.7, 4.4, 4.2],
  b: [7.2, 6.0, 5.1, 4.2, 3.6, 3.3, 3.0, 2.8],
  c: [7.2, 6.3, 5.2, 4.6, 4.0, 3.7, 3.4, 3.1],
  weeks: [2, 4, 9, 14, 20, 23, 31, 34],
  weekTicks: [0, 10, 20, 30, 40].map((v) => ({ value: v, label: String(v) })),
};

export const weekBars = [
  ['Mon', 9],
  ['Tue', 12],
  ['Wed', 8],
  ['Thu', 14],
  ['Fri', 11],
  ['Sat', 16],
  ['Sun', 13],
] as const;
