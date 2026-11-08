# SLP review pack

Status: DRAFT for review (H-07). All numbers in the sample come from fictional demonstration data.

## 1. Sample report

Open `docs/review/sample-slp.html` in a browser and print it to PDF (A4 portrait). It shows the SLP report for the fictional learner "Demo Learner" (P-07), last 7 days, labelled "Sample data". A real PDF export from the tablet is a device step (`NOT RUN`).

## 2. Definitions used

| Measure | Definition | Source | Minimum data |
| --- | --- | --- | --- |
| `independent_starts` | Sum of `count_b` ÷ sum of `count_a` over opportunities observations in period | adult | 5 sessions |
| `prompt_dependency` | Messages with prompting ≠ `independent` ÷ messages with any prompting entry | adult | 5 sessions |
| `words_used` | Distinct word symbols (kind `word`) with a meaningful use | auto | none |
| `needed_repair` | Built messages with breakdown `yes` ÷ built messages with any breakdown entry | adult | 5 sessions |
| `functions` | Count per function tag; `notRecorded` = messages without a function tag | adult | 5 sessions |
| `combinations` | Built messages with 2+ symbols grouped by exact sequence, top 3 by count; detail also: average symbols per built message (one decimal), built count, stored-phrase count | auto | none |
| `new_words` | Words whose first meaningful use ever falls inside the period | auto | none |
| `vocabulary_retention` | Words with meaningful use in the previous period that also have one in this period ÷ words with meaningful use in the previous period | auto | previous period has 1+ word |
| `response_latency` | Anchors: `session_started`, `page_opened`, `message_submitted`, `clear`. A sample is a `symbol_selected` that is the first selection after its latest preceding anchor in the same session; its value is the seconds between that anchor and the selection. Each selection counts at most once. Keep only samples whose symbol is core (`isCore`). Value: median. Detail: sample count | auto | 1 sample |
| `time_of_day` | Messages by local submit time: morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–20:59, night 21:00–04:59 | auto | none |
| `goals` | Active goals visible to the role, with the latest progress entry inside the period | adult | when a goal exists |

Rates, comparisons and planning ideas need at least 5 sessions in the period (D-15). Counts and lists show from the first session.

## 3. Planning idea texts

The SLP report has no planning idea.

## 4. Limitation notice shown on every report

> This report describes recorded app activity, not all communication. Usage statistics alone do not show language development.

Latency caution: "Time from the board appearing to a chosen core symbol. Motor, visual and setup factors affect this. It is not a measure of language ability."

## 5. Questions

1. Which measures are useful?
2. Is anything misleading?
3. Is the wording acceptable?
4. What is missing?

Reviewer: ____________   Date: ____________
