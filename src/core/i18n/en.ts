/**
 * All adult-facing UI strings — section 9.4 of the tasklist.
 * Keys use dot-notation groups. Later tasks append to this file.
 * Child labels and spoken text come from the vocabulary JSON, not this file.
 */
export const en = {
  // ── Errors ─────────────────────────────────────────────────────────────
  'errors.generic':            'Something went wrong. Your records are safe. Please try again.',
  'errors.db_open':            'The app could not open its records. Restart the app. If this keeps happening, contact support.',
  'errors.export_failed':      'The report could not be exported. Nothing was sent.',
  'errors.audio_unavailable':  'No Sinhala voice is installed. Only recorded clips will play.',

  // ── Sign in ─────────────────────────────────────────────────────────────
  'signin.title':              'Sign in',
  'signin.role_prompt':        'Select your role',
  'signin.pin_prompt':         'Enter PIN',
  'signin.wrong_pin':          'Incorrect PIN',
  'signin.locked':             'Too many attempts. Try again in {seconds} seconds.',

  // ── Onboarding ──────────────────────────────────────────────────────────
  'onboarding.welcome':        'Welcome to Katha',
  'onboarding.learner_name':   'Learner name',
  'onboarding.participant':    'Participant code',
  'onboarding.set_parent_pin': 'Set parent PIN',
  'onboarding.confirm_pin':    'Confirm PIN',
  'onboarding.pin_mismatch':   'PINs do not match',
  'onboarding.consent_title':  'Data and privacy',
  'onboarding.continue':       'Continue',
  'onboarding.finish':         'Finish setup',

  // ── Home ────────────────────────────────────────────────────────────────
  'home.start_session':        'Start session',
  'home.sessions':             'Sessions',
  'home.reports':              'Reports',
  'home.settings':             'Settings',

  // ── Session ─────────────────────────────────────────────────────────────
  'session.setting_label':     'Setting',
  'session.setting_home':      'Home',
  'session.setting_school':    'School',
  'session.setting_therapy':   'Therapy',
  'session.setting_unknown':   'Unknown',
  'session.start':             'Start child mode',
  'session.end':               'End session',
  'session.duration':          'Duration: {duration}',

  // ── Review ──────────────────────────────────────────────────────────────
  'review.title':              'Review session',
  'review.messages':           'Messages',
  'review.opportunities':      'Observed opportunities',
  'review.independent_starts': 'Independent starts',
  'review.tag_function':       'Function',
  'review.tag_prompt':         'Prompting level',
  'review.tag_breakdown':      'Breakdown',
  'review.save':               'Save review',
  'review.intent_chip':        'Meant this?',

  // ── Goals ───────────────────────────────────────────────────────────────
  'goals.title':               'Goals and progress',
  'goals.add':                 'Add goal',
  'goals.no_goals':            'No goals yet',
  'goals.target':              'Target',
  'goals.period':              'Period',

  // ── Dashboard ───────────────────────────────────────────────────────────
  'dashboard.title':           'Dashboard',
  'dashboard.period':          'Period',
  'dashboard.today':           'Today',
  'dashboard.last_7d':         'Last 7 days',
  'dashboard.last_30d':        'Last 30 days',
  'dashboard.no_sessions':     'No sessions in this period.',
  'dashboard.need_more':       'Data from at least 5 sessions is needed for rates.',

  // ── Builder ─────────────────────────────────────────────────────────────
  'builder.title':             'Build report',
  'builder.generate':          'Generate report',

  // ── Reports ─────────────────────────────────────────────────────────────
  'report.title':              'Report',
  'report.share':              'Share as PDF',
  'report.no_data':            'Not enough sessions to generate this section.',
  'report.date_range':         '{start} – {end}',

  // ── History ─────────────────────────────────────────────────────────────
  'history.title':             'Message history',
  'history.empty':             'No messages in this period.',

  // ── Share ────────────────────────────────────────────────────────────────
  'share.title':               'Share report',
  'share.consent_required':    'Sharing requires consent for each export.',
  'share.confirm':             'Confirm and share',
  'share.cancel':              'Cancel',

  // ── Settings ────────────────────────────────────────────────────────────
  'settings.title':            'Settings',
  'settings.child_view':       'Child view',
  'settings.voice_audio':      'Voice and audio',
  'settings.data_retention':   'Data and retention',
  'settings.about':            'About',
  'settings.vocabulary':       'Vocabulary',
  'settings.phone_guard':      'Use a tablet for child mode.',
} as const satisfies Record<string, string>;

export type StringKey = keyof typeof en;
