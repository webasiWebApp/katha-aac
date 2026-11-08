import { exportHtml, loadFontCss } from './deviceExport';

/** Device export hooks, grouped so screens can replace them in tests. */
export function deviceExportFor() {
  return {
    export: exportHtml,
    fontCss: async (): Promise<string | undefined> => {
      try {
        return await loadFontCss();
      } catch {
        return undefined; // PDF still builds; Sinhala shaping then depends on the system font
      }
    },
  };
}
