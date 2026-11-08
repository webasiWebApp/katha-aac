import {
  defaultCustomRange,
  formatCustomRange,
  isLocalDate,
  MAX_CUSTOM_DAYS,
  validateCustomRange,
} from '../domain/customPeriod';
import { periodFor } from '../ui/useReport';

const TODAY = '2026-11-08';

describe('custom period (PeriodSheet Custom)', () => {
  it('accepts only real YYYY-MM-DD dates', () => {
    expect(isLocalDate('2026-11-08')).toBe(true);
    expect(isLocalDate('2024-02-29')).toBe(true);
    expect(isLocalDate('2026-02-29')).toBe(false);
    expect(isLocalDate('2026-13-01')).toBe(false);
    expect(isLocalDate('8/11/2026')).toBe(false);
    expect(isLocalDate('')).toBe(false);
  });

  it('defaults to the last 90 days including today', () => {
    expect(defaultCustomRange(TODAY)).toEqual({ from: '2026-08-11', to: TODAY });
  });

  it('turns an inclusive range into an end-exclusive period', () => {
    expect(validateCustomRange({ from: '2026-10-01', to: '2026-10-31' }, TODAY)).toEqual({
      ok: true,
      period: { start: '2026-10-01', end: '2026-11-01' },
    });
    // One-day range, whitespace trimmed.
    expect(validateCustomRange({ from: ' 2026-11-08', to: '2026-11-08 ' }, TODAY)).toEqual({
      ok: true,
      period: { start: '2026-11-08', end: '2026-11-09' },
    });
  });

  it.each([
    [{ from: '2026-10-1', to: '2026-10-31' }, 'format'],
    [{ from: '2026-10-31', to: '2026-10-01' }, 'order'],
    [{ from: '2026-11-01', to: '2026-11-09' }, 'future'],
    [{ from: '2025-11-07', to: '2026-11-08' }, 'too_long'],
  ] as const)('rejects %j with %s', (range, error) => {
    expect(validateCustomRange(range, TODAY)).toEqual({ ok: false, error });
  });

  it('allows exactly the maximum length', () => {
    const r = validateCustomRange({ from: '2025-11-08', to: TODAY }, TODAY);
    expect(r.ok).toBe(true);
    expect(MAX_CUSTOM_DAYS).toBe(366);
  });

  it('formats the picker label', () => {
    expect(formatCustomRange({ from: '2026-08-11', to: TODAY })).toBe('11 Aug – 08 Nov 2026');
    expect(formatCustomRange({ from: '2025-12-20', to: '2026-01-08' })).toBe('20 Dec 2025 – 08 Jan 2026');
  });

  it('periodFor uses the custom range, and the 90-day default without one', () => {
    expect(periodFor('custom', TODAY, { from: '2026-10-01', to: '2026-10-31' })).toEqual({
      start: '2026-10-01',
      end: '2026-11-01',
    });
    expect(periodFor('custom', TODAY)).toEqual({ start: '2026-08-11', end: '2026-11-09' });
    expect(periodFor('7d', TODAY, { from: '2026-10-01', to: '2026-10-31' }).end).toBe('2026-11-09');
  });
});
