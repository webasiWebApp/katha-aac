import type { Destination } from './exportRepo';

/* eslint-disable @typescript-eslint/no-require-imports */
// Native modules are required lazily. NOT RUN (needs device): written against the documented
// expo-print / expo-sharing / expo-file-system (legacy SAF) APIs and verified by type check only.

const FONT_FILES: { family: string; weight: number; module: number }[] = [];

let fontCssCache: string | null = null;

/** @font-face rules with base64 data for Noto Sans and Noto Sans Sinhala (T-141). Cached. */
export async function loadFontCss(): Promise<string> {
  if (fontCssCache !== null) return fontCssCache;
  const { Asset } = require('expo-asset') as typeof import('expo-asset');
  const FS = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  const defs: { family: string; weight: number; file: number }[] = [
    { family: 'Noto Sans', weight: 400, file: require('../../../../assets/fonts/NotoSans_400Regular.ttf') as number },
    { family: 'Noto Sans', weight: 600, file: require('../../../../assets/fonts/NotoSans_600SemiBold.ttf') as number },
    { family: 'Noto Sans', weight: 700, file: require('../../../../assets/fonts/NotoSans_700Bold.ttf') as number },
    { family: 'Noto Sans Sinhala', weight: 400, file: require('../../../../assets/fonts/NotoSansSinhala_400Regular.ttf') as number },
    { family: 'Noto Sans Sinhala', weight: 600, file: require('../../../../assets/fonts/NotoSansSinhala_600SemiBold.ttf') as number },
  ];
  void FONT_FILES;
  const rules: string[] = [];
  for (const d of defs) {
    const asset = Asset.fromModule(d.file);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    const b64 = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 });
    rules.push(
      `@font-face { font-family: '${d.family}'; font-weight: ${d.weight}; src: url(data:font/ttf;base64,${b64}) format('truetype'); }`,
    );
  }
  fontCssCache = rules.join('\n');
  return fontCssCache;
}

/** Sends the report HTML to the chosen destination. Temporary files are deleted afterwards. */
export async function exportHtml(html: string, destination: Destination, fileName: string): Promise<void> {
  const Print = require('expo-print') as typeof import('expo-print');
  if (destination === 'print') {
    await Print.printAsync({ html });
    return;
  }
  const FS = require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
  const { uri } = await Print.printToFileAsync({ html });
  try {
    if (destination === 'share') {
      const Sharing = require('expo-sharing') as typeof import('expo-sharing');
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName });
    } else {
      const saf = FS.StorageAccessFramework;
      const perm = await saf.requestDirectoryPermissionsAsync();
      if (!perm.granted) throw new Error('save_cancelled');
      const target = await saf.createFileAsync(perm.directoryUri, fileName, 'application/pdf');
      const b64 = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 });
      await FS.writeAsStringAsync(target, b64, { encoding: FS.EncodingType.Base64 });
    }
  } finally {
    await FS.deleteAsync(uri, { idempotent: true });
  }
}
