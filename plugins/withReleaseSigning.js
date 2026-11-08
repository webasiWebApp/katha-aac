// Expo config plugin: signs local release builds with the upload key named in Gradle
// properties or environment variables (T-181). Nothing secret lives in the repository.
//
//   KATHA_UPLOAD_STORE_FILE      absolute path to the upload keystore (.jks)
//   KATHA_UPLOAD_STORE_PASSWORD
//   KATHA_UPLOAD_KEY_ALIAS
//   KATHA_UPLOAD_KEY_PASSWORD
//
// Put them in ~/.gradle/gradle.properties or export them before `./gradlew bundleRelease`.
// EAS builds inject their own signing config and are not affected.
// Without the properties the release build falls back to the debug key and Gradle prints a
// warning: such a build must never be uploaded to Google Play.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// katha-release-signing';

const SIGNING_BLOCK = `
        ${MARKER}
        release {
            def kathaProp = { String name -> project.findProperty(name) ?: System.getenv(name) }
            if (kathaProp('KATHA_UPLOAD_STORE_FILE')) {
                storeFile file(kathaProp('KATHA_UPLOAD_STORE_FILE'))
                storePassword kathaProp('KATHA_UPLOAD_STORE_PASSWORD')
                keyAlias kathaProp('KATHA_UPLOAD_KEY_ALIAS')
                keyPassword kathaProp('KATHA_UPLOAD_KEY_PASSWORD')
            }
        }`;

const RELEASE_SIGNING = `signingConfig signingConfigs.release.storeFile != null ? signingConfigs.release : signingConfigs.debug
            if (signingConfigs.release.storeFile == null) {
                logger.warn('Katha AAC: KATHA_UPLOAD_STORE_FILE is not set; release is signed with the DEBUG key. Do not upload this build.')
            }`;

function applyReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;
  const debugSigning = /signingConfigs\s*\{\s*debug\s*\{[^}]*\}/m;
  if (!debugSigning.test(gradle)) {
    throw new Error('withReleaseSigning: signingConfigs.debug block not found in app/build.gradle');
  }
  let out = gradle.replace(debugSigning, (m) => `${m}${SIGNING_BLOCK}`);
  const releaseType =
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/m;
  if (!releaseType.test(out)) {
    throw new Error(
      'withReleaseSigning: buildTypes.release signingConfig not found in app/build.gradle',
    );
  }
  out = out.replace(releaseType, (_m, head) => `${head}${RELEASE_SIGNING}`);
  return out;
}

const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withReleaseSigning: only Groovy build.gradle is supported');
    }
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });

module.exports = withReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
