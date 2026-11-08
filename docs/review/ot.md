# OT review pack

Status: DRAFT for review (H-07). All numbers in the sample come from fictional demonstration data.

## 1. Sample report

Open `docs/review/sample-ot.html` in a browser and print it to PDF (A4 portrait). It shows the OT report for the fictional learner "Demo Learner" (P-07), last 7 days, labelled "Sample data". A real PDF export from the tablet is a device step (`NOT RUN`).

## 2. Definitions used

| Measure | Definition | Source | Minimum data |
| --- | --- | --- | --- |
| `session_length` | Mean of `active_ms` per session, in minutes (one decimal) | auto | none |
| `corrections` | `undo` events ÷ `symbol_selected` events | auto | 5 sessions |
| `repeated_taps` | `symbol_selected` events where the previous selection in the same draft was the same symbol within 2000 ms ÷ all `symbol_selected` | auto | 5 sessions |
| `abandoned` | Drafts with a `draft_abandoned` event ÷ drafts started (distinct draft IDs) | auto | 5 sessions |
| `latency_within_session` | Same samples as `response_latency` but for any symbol, split into samples whose selection is within the first 180 s after session start and samples within the last 180 s before session end. Value: two medians | auto | 1 sample each |
| `pages_per_session` | Mean count of `page_opened` events per session (one decimal) | auto | none |
| `setup_notes` | Setup notes entered in the period, newest first | adult | when entered |
| `goals` | Active goals visible to the role, with the latest progress entry inside the period | adult | when a goal exists |

Rates, comparisons and planning ideas need at least 5 sessions in the period (D-15). Counts and lists show from the first session.

## 3. Planning idea texts

The OT report has no planning idea.

## 4. Limitation notice shown on every report

> This report describes recorded app activity, not all communication. Usage statistics alone do not show language development.

Access caution: "Changes in speed can reflect fatigue, position or setup. This report does not explain why."

Open decision D-14: this report shows time to first tap (OT) while the Final Report did not. Please confirm.

## 5. Questions

1. Which measures are useful?
2. Is anything misleading?
3. Is the wording acceptable?
4. What is missing?

Reviewer: ____________   Date: ____________
