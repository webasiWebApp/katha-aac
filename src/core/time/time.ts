/** At + local offset record — section 4 conventions. */
export interface TimeRecord {
  at: string;       // ISO 8601 UTC
  offsetMin: number; // -new Date().getTimezoneOffset()
}

/** Period with start inclusive and end exclusive — section 4 conventions. */
export interface Period {
  start: string; // local date YYYY-MM-DD
  end: string;   // local date YYYY-MM-DD, exclusive
}

export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export type PeriodPreset = 'today' | '7d' | '30d';

// ── Core helpers ─────────────────────────────────────────────────────────────

/** Returns local Date from UTC string + offset in minutes. */
export function toLocal(at: string, offsetMin: number): Date {
  const utc = new Date(at).getTime();
  return new Date(utc + offsetMin * 60_000);
}

/** Returns 'YYYY-MM-DD' in local time. */
export function localDate(at: string, offsetMin: number): string {
  const d = toLocal(at, offsetMin);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Captures the current moment as an at+offsetMin record. */
export function nowRecord(): TimeRecord {
  return {
    at: new Date().toISOString(),
    offsetMin: -new Date().getTimezoneOffset(),
  };
}

// ── Period ────────────────────────────────────────────────────────────────────

/**
 * Returns true when the event at `at` (UTC) falls within the period.
 * A record belongs to the period when its local date-time is >= start 00:00
 * and < end 00:00 (end is exclusive).
 */
export function inPeriod(at: string, offsetMin: number, period: Period): boolean {
  const local = localDate(at, offsetMin);
  return local >= period.start && local < period.end;
}

/** Returns a period ending at the given period's start, with the same span. */
export function previousPeriod(period: Period): Period {
  const days = periodDays(period);
  const endMs = dateToMs(period.start);
  const startMs = endMs - days * 86_400_000;
  return { start: msToDate(startMs), end: period.start };
}

/** Number of calendar days in the period. */
export function periodDays(period: Period): number {
  return Math.round((dateToMs(period.end) - dateToMs(period.start)) / 86_400_000);
}

/**
 * Builds a Period from a named preset, relative to `today` (YYYY-MM-DD).
 * 'today' → single day; '7d' → last 7 days ending today (exclusive); '30d' → last 30 days.
 */
export function presetPeriod(preset: PeriodPreset, today: string): Period {
  const todayMs = dateToMs(today);
  const tomorrowMs = todayMs + 86_400_000;

  switch (preset) {
    case 'today':
      return { start: today, end: msToDate(tomorrowMs) };
    case '7d':
      return { start: msToDate(tomorrowMs - 7 * 86_400_000), end: msToDate(tomorrowMs) };
    case '30d':
      return { start: msToDate(tomorrowMs - 30 * 86_400_000), end: msToDate(tomorrowMs) };
  }
}

// ── Time of day ───────────────────────────────────────────────────────────────

/**
 * Returns the time-of-day bucket for an event, per section 7.2:
 * morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–20:59, night 21:00–04:59.
 */
export function timeOfDayBucket(at: string, offsetMin: number): TimeOfDayBucket {
  const d = toLocal(at, offsetMin);
  const h = d.getUTCHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// ── Formatters ────────────────────────────────────────────────────────────────

/** 'DD Mon' e.g. '05 Nov'. */
export function formatShortDate(at: string, offsetMin: number): string {
  const d = toLocal(at, offsetMin);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${day} ${MONTHS[d.getUTCMonth()]}`;
}

/** 'HH:MM' 24-hour local time. */
export function formatTime(at: string, offsetMin: number): string {
  const d = toLocal(at, offsetMin);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Adds n calendar days to a YYYY-MM-DD date. */
export function addDays(date: string, n: number): string {
  return msToDate(dateToMs(date) + n * 86_400_000);
}

// ── Private helpers ───────────────────────────────────────────────────────────

function dateToMs(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function msToDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
