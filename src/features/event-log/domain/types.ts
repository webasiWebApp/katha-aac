import type { Setting } from '@/core/types/common';

export interface SessionRow {
  id: string;
  learner_id: string;
  vocabulary_version_id: string;
  setting: Setting;
  started_at: string;
  offset_min: number;
  ended_at: string | null;
  end_reason: 'adult_exit' | 'background_timeout' | 'app_restart' | null;
  active_ms: number;
  started_by_role: string;
}

export interface EventRow {
  id: string;
  session_id: string;
  learner_id: string;
  type: string;
  schema_version: number;
  at: string;
  offset_min: number;
  symbol_id: string | null;
  draft_id: string | null;
  message_id: string | null;
  source: 'grid' | 'core' | 'quick' | 'template' | null;
  page_id: string | null;
  payload_json: string;
}

export interface AttemptRow {
  id: string;
  session_id: string;
  learner_id: string;
  draft_id: string | null;
  submitted_at: string;
  offset_min: number;
  kind: 'built' | 'stored_phrase';
  symbol_ids_json: string;
  text_snapshot: string;
  symbol_count: number;
  template_id: string | null;
  vocabulary_version_id: string;
}

export interface AudioAttemptRow {
  id: string;
  session_id: string;
  message_id: string | null;
  symbol_id: string | null;
  kind: 'word' | 'message_first' | 'message_replay';
  requested_at: string;
  outcome: 'clip' | 'voice' | 'failed' | 'unsupported';
  error_code: string | null;
}

export interface MeaningfulUse {
  symbolId: string;
  messageId: string;
  sessionId: string;
  at: string;
  offsetMin: number;
}
