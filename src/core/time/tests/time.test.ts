import {
  localDate,
  toLocal,
  inPeriod,
  previousPeriod,
  periodDays,
  presetPeriod,
  timeOfDayBucket,
  formatShortDate,
  formatTime,
} from '../time';

// Sri Lanka offset: +330 min (UTC+5:30)
const SL = 330;
// UTC offset
const UTC = 0;

// ── localDate ────────────────────────────────────────────────────────────────

test('localDate: UTC midnight stays same calendar day (UTC+0)', () => {
  expect(localDate('2024-03-15T00:00:00.000Z', UTC)).toBe('2024-03-15');
});

test('localDate: UTC midnight shifts to previous day at UTC+5:30', () => {
  // 2024-03-15 00:00 UTC = 2024-03-15 05:30 local — same day
  expect(localDate('2024-03-15T00:00:00.000Z', SL)).toBe('2024-03-15');
});

test('localDate: just before midnight in SL crosses to next UTC day', () => {
  // 2024-03-14 18:31 UTC = 2024-03-15 00:01 SL → '2024-03-15' local
  expect(localDate('2024-03-14T18:31:00.000Z', SL)).toBe('2024-03-15');
});

test('localDate: 23:59 UTC is still same day UTC+0', () => {
  expect(localDate('2024-03-15T23:59:59.999Z', UTC)).toBe('2024-03-15');
});

// ── inPeriod ─────────────────────────────────────────────────────────────────

test('inPeriod: start is inclusive', () => {
  // 2024-03-01 00:00:00 UTC  (offset 0)
  expect(inPeriod('2024-03-01T00:00:00.000Z', UTC, { start: '2024-03-01', end: '2024-03-08' })).toBe(true);
});

test('inPeriod: end is exclusive', () => {
  // 2024-03-08 00:00:00 UTC — this is the end day, should be false
  expect(inPeriod('2024-03-08T00:00:00.000Z', UTC, { start: '2024-03-01', end: '2024-03-08' })).toBe(false);
});

test('inPeriod: last second before end is inside', () => {
  expect(inPeriod('2024-03-07T23:59:59.999Z', UTC, { start: '2024-03-01', end: '2024-03-08' })).toBe(true);
});

test('inPeriod: midnight boundary with SL offset', () => {
  // 2024-03-14 18:31 UTC = 2024-03-15 00:01 SL — is 2024-03-15 inside the period?
  const period = { start: '2024-03-15', end: '2024-03-16' };
  expect(inPeriod('2024-03-14T18:31:00.000Z', SL, period)).toBe(true);
});

test('inPeriod: before period is false', () => {
  expect(inPeriod('2024-02-29T12:00:00.000Z', UTC, { start: '2024-03-01', end: '2024-03-08' })).toBe(false);
});

// ── previousPeriod ───────────────────────────────────────────────────────────

test('previousPeriod: 7-day period shifts back correctly', () => {
  const period = { start: '2024-03-08', end: '2024-03-15' };
  const prev = previousPeriod(period);
  expect(prev.start).toBe('2024-03-01');
  expect(prev.end).toBe('2024-03-08');
});

test('previousPeriod: 1-day period', () => {
  const period = { start: '2024-03-15', end: '2024-03-16' };
  const prev = previousPeriod(period);
  expect(prev.start).toBe('2024-03-14');
  expect(prev.end).toBe('2024-03-15');
});

// ── periodDays ───────────────────────────────────────────────────────────────

test('periodDays: 7 days', () => {
  expect(periodDays({ start: '2024-03-08', end: '2024-03-15' })).toBe(7);
});

test('periodDays: 1 day', () => {
  expect(periodDays({ start: '2024-03-15', end: '2024-03-16' })).toBe(1);
});

test('periodDays: 30 days', () => {
  expect(periodDays({ start: '2024-02-14', end: '2024-03-15' })).toBe(30);
});

// ── presetPeriod ─────────────────────────────────────────────────────────────

test('presetPeriod: today is a 1-day period', () => {
  const p = presetPeriod('today', '2024-03-15');
  expect(p.start).toBe('2024-03-15');
  expect(p.end).toBe('2024-03-16');
  expect(periodDays(p)).toBe(1);
});

test('presetPeriod: 7d is 7 calendar days ending after today', () => {
  const p = presetPeriod('7d', '2024-03-15');
  expect(p.end).toBe('2024-03-16');
  expect(periodDays(p)).toBe(7);
});

test('presetPeriod: 30d is 30 calendar days', () => {
  const p = presetPeriod('30d', '2024-03-15');
  expect(p.end).toBe('2024-03-16');
  expect(periodDays(p)).toBe(30);
});

// ── timeOfDayBucket ──────────────────────────────────────────────────────────

test('timeOfDayBucket: 05:00 = morning', () => {
  // UTC+0: 05:00 UTC
  expect(timeOfDayBucket('2024-03-15T05:00:00.000Z', UTC)).toBe('morning');
});

test('timeOfDayBucket: 11:59 = morning', () => {
  expect(timeOfDayBucket('2024-03-15T11:59:00.000Z', UTC)).toBe('morning');
});

test('timeOfDayBucket: 12:00 = afternoon', () => {
  expect(timeOfDayBucket('2024-03-15T12:00:00.000Z', UTC)).toBe('afternoon');
});

test('timeOfDayBucket: 16:59 = afternoon', () => {
  expect(timeOfDayBucket('2024-03-15T16:59:00.000Z', UTC)).toBe('afternoon');
});

test('timeOfDayBucket: 17:00 = evening', () => {
  expect(timeOfDayBucket('2024-03-15T17:00:00.000Z', UTC)).toBe('evening');
});

test('timeOfDayBucket: 20:59 = evening', () => {
  expect(timeOfDayBucket('2024-03-15T20:59:00.000Z', UTC)).toBe('evening');
});

test('timeOfDayBucket: 21:00 = night', () => {
  expect(timeOfDayBucket('2024-03-15T21:00:00.000Z', UTC)).toBe('night');
});

test('timeOfDayBucket: 04:59 = night', () => {
  expect(timeOfDayBucket('2024-03-15T04:59:00.000Z', UTC)).toBe('night');
});

test('timeOfDayBucket: SL offset shifts the hour correctly', () => {
  // 2024-03-15 00:30 UTC = 06:00 SL → morning
  expect(timeOfDayBucket('2024-03-15T00:30:00.000Z', SL)).toBe('morning');
});

// ── formatShortDate + formatTime ─────────────────────────────────────────────

test('formatShortDate returns DD Mon', () => {
  expect(formatShortDate('2024-03-05T00:00:00.000Z', UTC)).toBe('05 Mar');
});

test('formatShortDate accounts for offset', () => {
  // 2024-03-14 23:00 UTC = 2024-03-15 04:30 SL → '15 Mar'
  expect(formatShortDate('2024-03-14T23:00:00.000Z', SL)).toBe('15 Mar');
});

test('formatTime returns HH:MM 24h', () => {
  expect(formatTime('2024-03-15T14:30:00.000Z', UTC)).toBe('14:30');
});

test('formatTime accounts for offset', () => {
  // 2024-03-15 00:30 UTC = 06:00 SL
  expect(formatTime('2024-03-15T00:30:00.000Z', SL)).toBe('06:00');
});

// ── toLocal ───────────────────────────────────────────────────────────────────

test('toLocal: +330 offset shifts by 5h30m', () => {
  const d = toLocal('2024-03-15T00:00:00.000Z', SL);
  expect(d.getUTCHours()).toBe(5);
  expect(d.getUTCMinutes()).toBe(30);
});

describe('formatPeriod (display, inclusive end)', () => {
  it('shows the last day of an end-exclusive period', () => {
    const { formatPeriod } = jest.requireActual<typeof import('../time')>('../time');
    expect(formatPeriod({ start: '2026-11-02', end: '2026-11-09' })).toBe('2026-11-02 – 2026-11-08');
    expect(formatPeriod({ start: '2026-10-01', end: '2026-11-02' })).toBe('2026-10-01 – 2026-11-01');
    expect(formatPeriod({ start: '2026-11-08', end: '2026-11-09' })).toBe('2026-11-08');
    expect(formatPeriod({ start: '2026-12-31', end: '2027-01-01' })).toBe('2026-12-31');
  });
});
