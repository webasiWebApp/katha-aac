// Source: Figma variable collection "Labels" (modes සිංහල / English), 30 core and local words.
// verify with SLT: every Sinhala string below is a spoken-register PLACEHOLDER pending review by
// the speech-language therapist (SLT). Do not ship without that check (handoff: R7, decisions).

export type Locale = 'si' | 'en';

export interface WordLabel {
  /** Sinhala (සිංහල) label. verify with SLT */
  si: string;
  /** English label. */
  en: string;
}

export const wordLabels = {
  // verify with SLT
  me: { si: 'මට', en: 'to me' },
  want: { si: 'ඕනේ', en: 'want' },
  more: { si: 'තව', en: 'more' },
  stop: { si: 'නවත්තන්න', en: 'stop' },
  help: { si: 'උදව්', en: 'help' },
  yes: { si: 'ඔව්', en: 'yes' },
  no: { si: 'නෑ', en: 'no' },
  finished: { si: 'ඉවරයි', en: 'finished' },
  eat: { si: 'කන්න', en: 'eat' },
  drink: { si: 'බොන්න', en: 'drink' },
  go: { si: 'යන්න', en: 'go' },
  play: { si: 'සෙල්ලම්', en: 'play' },
  bathe: { si: 'නාන්න', en: 'bathe' },
  sleep: { si: 'නිදාගන්න', en: 'sleep' },
  toilet: { si: 'වැසිකිළිය', en: 'toilet' },
  happy: { si: 'සතුටුයි', en: 'happy' },
  sad: { si: 'දුකයි', en: 'sad' },
  hurts: { si: 'රිදෙනවා', en: 'it hurts' },
  water: { si: 'වතුර', en: 'water' },
  milk: { si: 'කිරි', en: 'milk' },
  kiribath: { si: 'කිරිබත්', en: 'milk rice' },
  kottu: { si: 'කොත්තු', en: 'kottu' },
  rice: { si: 'බත්', en: 'rice' },
  hoppers: { si: 'ආප්ප', en: 'hoppers' },
  amma: { si: 'අම්මා', en: 'mother' },
  thaththa: { si: 'තාත්තා', en: 'father' },
  achchi: { si: 'ආච්චි', en: 'grandmother' },
  teacher: { si: 'ගුරුතුමිය', en: 'teacher' },
  school: { si: 'ඉස්කෝලේ', en: 'school' },
  bus: { si: 'බස් එක', en: 'bus' },
} as const satisfies Record<string, WordLabel>;

// Child-view navigation and action labels. Sinhala strings are the text on the Figma instances
// (CoreKeyRow, ChildButton). They are NOT in the Figma "Labels" collection, so English is taken
// from the handoff notes ("Home, Quick needs, Break, Speak"). verify with SLT.
export const navLabels = {
  home: { si: 'ගෙදර', en: 'Home' },
  quick: { si: 'ඉක්මන්', en: 'Quick needs' },
  break: { si: 'විවේකය', en: 'Break' },
  speak: { si: 'කියන්න', en: 'Speak' },
} as const satisfies Record<string, WordLabel>;

export type NavKey = keyof typeof navLabels;

export function getNavLabel(key: NavKey, locale: Locale = 'si'): string {
  return navLabels[key][locale];
}

export type WordKey = keyof typeof wordLabels;

export function getWordLabel(key: WordKey, locale: Locale = 'si'): string {
  return wordLabels[key][locale];
}
