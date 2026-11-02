import { t } from '../t';
import { en } from '../en';

describe('t()', () => {
  test('returns the string for a known key', () => {
    expect(t('errors.generic')).toBe(en['errors.generic']);
  });

  test('interpolates {param} placeholders', () => {
    expect(t('signin.locked', { seconds: '30' })).toBe(
      'Too many attempts. Try again in 30 seconds.',
    );
  });

  test('interpolates numeric params', () => {
    expect(t('signin.locked', { seconds: 60 })).toBe(
      'Too many attempts. Try again in 60 seconds.',
    );
  });

  test('leaves unmatched placeholders unchanged', () => {
    expect(t('signin.locked', {})).toContain('{seconds}');
  });

  test('missing key throws in __DEV__', () => {
    const g = global as Record<string, unknown>;
    const origDev = g['__DEV__'];
    g['__DEV__'] = true;
    try {
      expect(() => t('nonexistent.key' as string)).toThrow('[i18n] Missing string key');
    } finally {
      g['__DEV__'] = origDev;
    }
  });

  test('missing key returns the key string in production', () => {
    const g = global as Record<string, unknown>;
    const origDev = g['__DEV__'];
    g['__DEV__'] = false;
    try {
      expect(t('nonexistent.key' as string)).toBe('nonexistent.key');
    } finally {
      g['__DEV__'] = origDev;
    }
  });

  test('all required error keys are present', () => {
    const errorKeys = [
      'errors.generic',
      'errors.db_open',
      'errors.export_failed',
      'errors.audio_unavailable',
    ] as const;
    for (const key of errorKeys) {
      expect(typeof t(key)).toBe('string');
      expect(t(key).length).toBeGreaterThan(0);
    }
  });
});
