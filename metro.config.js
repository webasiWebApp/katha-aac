const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver = {
  ...resolver,
  // wasm: expo-sqlite on web (web preview only).
  assetExts: [...resolver.assetExts.filter((ext) => ext !== 'svg'), 'wasm'],
  sourceExts: [...resolver.sourceExts, 'svg'],
};

// Web preview: replace expo-sqlite's WorkerChannel with a copy that reuses its sync buffer
// (see web-preview/expo-sqlite/WorkerChannel.ts). Web bundles only.
const path = require('path');
const PATCHED_CHANNEL = path.resolve(__dirname, 'web-preview/expo-sqlite/WorkerChannel.ts');
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === 'web' &&
    moduleName === './WorkerChannel' &&
    context.originModulePath.split(path.sep).join('/').includes('/expo-sqlite/web/')
  ) {
    return { type: 'sourceFile', filePath: PATCHED_CHANNEL };
  }
  return upstreamResolve
    ? upstreamResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

// Web preview: expo-sqlite's synchronous API needs SharedArrayBuffer, which browsers only
// allow on cross-origin-isolated pages. Has no effect on Android builds.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  },
};

module.exports = config;
