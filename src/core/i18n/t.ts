import { en, type StringKey } from './en';

/**
 * Typed overload: key is a known StringKey — no runtime check needed.
 * String overload: dynamic key — missing key throws in __DEV__, returns key in production.
 */
export function t(key: StringKey, params?: Record<string, string | number>): string;
export function t(key: string, params?: Record<string, string | number>): string;
export function t(key: string, params?: Record<string, string | number>): string {
  const template: string | undefined = (en as Record<string, string>)[key];
  if (template === undefined) {
    if (__DEV__) {
      throw new Error(`[i18n] Missing string key: "${key}"`);
    }
    return key;
  }
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value !== undefined ? String(value) : match;
  });
}
