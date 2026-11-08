export type Role = 'parent' | 'slp' | 'educator' | 'ot';
export type Setting = 'home' | 'school' | 'therapy' | 'unknown';
export type GridSize = '3x4' | '4x5' | '5x6';
export type WordCategory = 'people' | 'action' | 'describing' | 'thing' | 'core' | 'folder';
export type LocalDate = string; // 'YYYY-MM-DD'
export interface Period {
  start: LocalDate;
  end: LocalDate; // exclusive
}
export type IntentAnswer = 'meant' | 'not_meant' | 'unsure';
export type FunctionTag = 'requesting' | 'refusing' | 'commenting' | 'greeting';
export type PromptLevel = 'independent' | 'gesture' | 'verbal' | 'model' | 'physical';
export type AudioOutcome = 'clip' | 'voice' | 'failed' | 'unsupported';
