# Katha AAC — Measure Definitions

Source: tasklist.md sections 7.1 and 7.2.

## 7.1 Shared rules

- A session is **in the period** when its local start date-time is inside the period. All its events, messages and observations belong to that period.
- **Rate lock:** a measure with `minSessions: 5` returns `locked: true, value: null` when fewer than 5 sessions are in the period.
- **Meaningful use:** a symbol has a meaningful use in a message when the child selected it (`symbol_selected` with source `grid` or `core`) in the submitted draft and it is still in the final message (not undone). Template words inserted by the app are not selections. A stored phrase counts as one use of that phrase, not of words.
- **Rounding:** percentages = `Math.round(numerator / denominator * 100)`. Medians of an even count are the mean of the two middle values, shown to one decimal.
- **Ties** in "most used" lists: higher count first, then earlier first meaningful use in the period.

## 7.2 Measure registry

| ID | Definition | Source | Min data |
| --- | --- | --- | --- |
| `sessions` | Count of sessions in period. Detail: days with at least one session, days in period | auto | none |
| `messages_sent` | Count of `communication_attempts` in period. Detail: built count, stored-phrase count, change vs previous period (only if both periods have 5+ sessions) | auto | none |
| `selections` | Count of `symbol_selected` events in period, all sources | auto | none |
| `words_used` | Distinct word symbols (kind `word`) with a meaningful use | auto | none |
| `top_words` | Words with meaningful use, counts, sorted by the tie rule, top 6 | auto | none |
| `new_words` | Words whose first meaningful use ever falls inside the period | auto | none |
| `confirmed_meant` | Messages with intent `meant` ÷ messages with any intent answer. `notRecorded` = messages without an answer | adult | 5 sessions |
| `independent_starts` | Sum of `count_b` ÷ sum of `count_a` over opportunities observations in period | adult | 5 sessions |
| `prompted_vs_independent` | From opportunities: independent = Σcount_b, prompted = Σ(count_a − count_b) | adult | 5 sessions |
| `prompt_dependency` | Messages with prompting ≠ `independent` ÷ messages with any prompting entry | adult | 5 sessions |
| `functions` | Count per function tag; `notRecorded` = messages without a function tag | adult | 5 sessions |
| `combinations` | Built messages with 2+ symbols grouped by exact sequence, top 3 by count; detail also: average symbols per built message (one decimal), built count, stored-phrase count | auto | none |
| `needed_repair` | Built messages with breakdown `yes` ÷ built messages with any breakdown entry | adult | 5 sessions |
| `vocabulary_retention` | Words with meaningful use in the previous period that also have one in this period ÷ words with meaningful use in the previous period | auto | previous period has 1+ word |
| `response_latency` | Anchors: `session_started`, `page_opened`, `message_submitted`, `clear`. A sample is a `symbol_selected` that is the first selection after its latest preceding anchor in the same session; its value is the seconds between that anchor and the selection. Each selection counts at most once. Keep only samples whose symbol is core (`isCore`). Value: median. Detail: sample count | auto | 1 sample |
| `latency_within_session` | Same samples as `response_latency` but for any symbol, split into samples whose selection is within the first 180 s after session start and samples within the last 180 s before session end. Value: two medians | auto | 1 sample each |
| `time_of_day` | Messages by local submit time: morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–20:59, night 21:00–04:59 | auto | none |
| `corrections` | `undo` events ÷ `symbol_selected` events | auto | 5 sessions |
| `repeated_taps` | `symbol_selected` events where the previous selection in the same draft was the same symbol within 2000 ms ÷ all `symbol_selected` | auto | 5 sessions |
| `abandoned` | Drafts with a `draft_abandoned` event ÷ drafts started (distinct draft IDs) | auto | 5 sessions |
| `session_length` | Mean of `active_ms` per session, in minutes (one decimal) | auto | none |
| `pages_per_session` | Mean count of `page_opened` events per session (one decimal) | auto | none |
| `class_messages` | `messages_sent` restricted to sessions with setting `school` | auto/adult | none |
| `class_words` | `top_words` restricted to school sessions | auto/adult | none |
| `class_help_requests` | Meaningful uses of `sym_help` plus uses of `phr_help` in school sessions | auto/adult | none |
| `class_independent_starts` | `independent_starts` restricted to school sessions | adult | 5 school sessions in period |
| `class_prompted_vs_independent` | `prompted_vs_independent` restricted to school sessions | adult | 5 school sessions in period |
| `class_messages_weekly` | Messages in school sessions per week for the 6 weeks ending at period end | auto/adult | none |
| `goals` | Active goals visible to the role, with the latest progress entry inside the period | adult | when a goal exists |
| `setup_notes` | Setup notes entered in the period, newest first | adult | when entered |
| `planning_idea` | One template sentence chosen by the rules in 8.3 | template | 5 sessions |
