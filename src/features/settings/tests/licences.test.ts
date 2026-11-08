import { loadLicences, parseLicences } from '../data/licences';

describe('licences (T-154)', () => {
  it('sorts entries by package name and keeps licence and repository', () => {
    const out = parseLicences({
      'zeta@1.0.0': { licenses: 'MIT' },
      'alpha@2.0.0': { licenses: 'Apache-2.0', repository: 'https://example.org/alpha' },
    });
    expect(out).toEqual([
      { pkg: 'alpha@2.0.0', licenses: 'Apache-2.0', repository: 'https://example.org/alpha' },
      { pkg: 'zeta@1.0.0', licenses: 'MIT', repository: undefined },
    ]);
  });

  it('the bundled file lists the app runtime packages with a licence each', () => {
    const all = loadLicences();
    const names = all.map((l) => l.pkg.replace(/@[^@]+$/, ''));
    for (const required of ['react', 'react-native', 'expo', 'expo-sqlite', 'zustand']) {
      expect(names).toContain(required);
    }
    expect(all.every((l) => l.licenses.length > 0 && l.licenses !== 'UNKNOWN')).toBe(true);
  });
});
