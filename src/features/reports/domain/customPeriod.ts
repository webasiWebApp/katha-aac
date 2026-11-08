// Custom report period (PeriodSheet "Custom (two date fields)", section 5).
// The adult enters an inclusive From and To local date; the period end is exclusive (section 4).
import type { Period } from '@/core/types/common';

export interface CustomRange {
  /** Local date YYYY-MM-DD, inclusive. */
  from: string;
  /** Local date YYYY-MM-DD, inclusive. */
  to: string;
}

export type CustomRangeError = 'format' | 'order' | 'future' | 'too_long';

/** Longest custom period, in days (one leap year). */
export const MAX_CUSTOM_DAYS = 366;
/** Length of the custom range offered before the adult edits it. */
export const DEFAULT_CUSTOM_DAYS = 90;

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function toDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30). */
export function isLocalDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const ms = toMs(value);
  return !Number.isNaN(ms) && toDate(ms) === value;
}

/** The last 90 days up to and including today. */
export function defaultCustomRange(today: string): CustomRange {
  return { from: toDate(toMs(today) - (DEFAULT_CUSTOM_DAYS - 1) * DAY_MS), to: today };
}

export type CustomRangeResult =
  { ok: true; period: Period } | { ok: false; error: CustomRangeError };

export function validateCustomRange(range: CustomRange, today: string): CustomRangeResult {
  const from = range.from.trim();
  const to = range.to.trim();
  if (!isLocalDate(from) || !isLocalDate(to)) return { ok: false, error: 'format' };
  const fromMs = toMs(from);
  const toMsValue = toMs(to);
  if (fromMs > toMsValue) return { ok: false, error: 'order' };
  if (toMsValue > toMs(today)) return { ok: false, error: 'future' };
  const days = (toMsValue - fromMs) / DAY_MS + 1;
  if (days > MAX_CUSTOM_DAYS) return { ok: false, error: 'too_long' };
  return { ok: true, period: { start: from, end: toDate(toMsValue + DAY_MS) } };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(date: string, withYear: boolean): string {
  const [y, m, d] = date.split('-');
  const base = `${d} ${MONTHS[Number(m) - 1] ?? m}`;
  return withYear ? `${base} ${y}` : base;
}

/** Picker label, for example "11 Aug – 08 Nov 2026" or "20 Dec 2025 – 08 Jan 2026". */
export function formatCustomRange(range: CustomRange): string {
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  return `${shortDate(range.from, !sameYear)} – ${shortDate(range.to, true)}`;
}
