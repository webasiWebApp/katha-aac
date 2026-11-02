# Katha AAC — Role Report Matrix

Source: tasklist.md sections 8.2 and 8.3.

## 8.2 The four report definitions

### Parent report
- **Title:** "Parent report"
- **Subtitle:** "Everyday communication at home, in plain language."
- **Glance:** messages_sent, words_used, independent_starts, confirmed_meant (label "Confirmed as meant")
- **Sections:**
  - `words` wordChips [top_words, new_words] "Words used most" / "Counts of words in messages the child spoke."
  - `functions` barRows [functions] "What the messages were for" / "Tagged for {tagged} of {total} messages. {notRecorded} were not recorded."
  - `timeOfDay` barChart [time_of_day] "Messages by time of day"
  - `idea` planningIdea [planning_idea]
  - `goals` goals [goals]

### SLP report
- **Title:** "SLP report"
- **Subtitle:** "Detail for assessment and intervention planning."
- **Glance:** independent_starts, prompt_dependency, words_used (label "Vocabulary items"), needed_repair
- **Sections:**
  - `functions` barRows [functions] "Communication functions"
  - `combinations` combinations [combinations] "Symbol combinations" / "{built} built messages, average {avg} symbols. {stored} were stored phrases."
  - `vocabChange` metricPair [new_words, vocabulary_retention] "Vocabulary introduction and retention"
  - `latency` latencyCard [response_latency] "Response latency"
  - `timeOfDay` barChart [time_of_day] "Messages by time of day"
  - `goals` goals [goals]

### Educator / School report
- **Title:** "School report"
- **Subtitle:** "Participation in class activities only."
- **Glance:** class_messages, class_help_requests, class_independent_starts, class_words (count of distinct, label "Words used in class")
- **Sections:**
  - `classWords` wordChips [class_words] "Words used in class"
  - `independence` barRows [class_prompted_vs_independent] "Independent and prompted"
  - `weekly` lineChart [class_messages_weekly] "Class messages over 6 weeks"
  - `idea` planningIdea [planning_idea]
  - `goals` goals [goals]

### OT report
- **Title:** "OT report"
- **Subtitle:** "How the child accesses and uses the device."
- **Glance:** session_length (label "Average session"), corrections, repeated_taps, abandoned
- **Sections:**
  - `access` metricPair [latency_within_session] "Access within a session" / caution "Changes in speed can reflect fatigue, position or setup. This report does not explain why."
  - `interaction` barRows [corrections, repeated_taps, abandoned] "Interaction pattern"
  - `pages` latencyCard-style card [pages_per_session] "Screens visited per session"
  - `setup` notes [setup_notes] "Setup notes (entered by an adult)"
  - `goals` goals [goals]

## 8.3 Planning idea templates

Shown only when the role's definition includes `planning_idea` and the period has 5+ sessions.
Pick the first rule whose condition is true; if none, hide the section.

| ID | Role | Condition | Text |
| --- | --- | --- | --- |
| PI-P1 | parent | One time-of-day bucket has at least 40% of messages and at least 2 thing-category words were used | "Most messages were in the {bucket}. You could offer a choice during {bucket} activities, such as {thing1} or {thing2}." |
| PI-P2 | parent | Any period | "The words used most were {word1} and {word2}. You could model them during everyday routines." |
| PI-E1 | educator | class_help_requests ≥ 1 | "{helpWord} was used for {n} help requests in class. Consider preparing symbols for the next class activity." |
| PI-E2 | educator | class_messages ≥ 1 | "{n} messages were recorded in class. Consider planning one more chance to choose during each lesson." |

Every planning idea card ends with: "A suggestion for adults. Nothing in the app changes by itself."
