// Public API of the event-log feature. Other features import ONLY from here.
export {
  appendEvent,
  commitMessage,
  recordAudioAttempt,
  EVENT_SCHEMA_VERSION,
  type NewEvent,
  type EventType,
  type CommitMessageArgs,
  type AudioAttemptInput,
} from './data/eventRepo';
export {
  loadPeriodData,
  loadDataForSessions,
  listSessionsInPeriod,
  listMessages,
  listSessionMessages,
  firstMeaningfulUseBySymbol,
  type PeriodData,
  type MessageFilter,
  type MessageListItem,
} from './data/readRepo';
export { computeMeaningfulUses } from './domain/meaningful';
export type {
  SessionRow,
  EventRow,
  AttemptRow,
  AudioAttemptRow,
  MeaningfulUse,
} from './domain/types';
