/**
 * Expo Config Plugin: turns on R8 optimization for Android release builds without breaking
 * data that survives app updates.
 *
 * Google Play requires >= 25 % optimization, obfuscation AND shrinking from February 2027.
 * The Expo template uses proguard-android.txt (-dontoptimize → 0 % optimization). This plugin:
 *
 * 1. Replaces it with plugins/r8/proguard-optimize-base.pro (copied into android/app): AGP's
 *    optimize rules WITHOUT -allowaccessmodification.
 * 2. Switches R8 to compat mode (android.enableR8.fullMode=false). In full mode R8 widens access
 *    modifiers even of kept classes (protected -> public). expo-notifications stores scheduled
 *    reminders as Java-serialized objects without a declared serialVersionUID, so the computed
 *    one changes and reminders saved by the previous version are deleted when they fire
 *    (verified 2026-10-17: InvalidClassException on NotificationRequest).
 * 3. Raises AGP from 8.12.0 (React Native's version catalog) to 8.12.3, the latest 8.12 patch.
 *    Play reads the scores from r8.json only for builds made with the latest AGP patch, and
 *    8.12.3 bundles R8 8.12.22. Gradle resolves the version conflict upwards, so this never
 *    downgrades AGP. Never raise AGP without (1): Play would then measure 0 % optimization.
 *
 * Remove once the Expo template ships optimization (see the tripwire tests in
 * __tests__/config/androidReleaseBuild.test.ts and technical-guides:Android-Release-Build.md).
 *
 * Registered since 7.0.2 (a test enforces it). It depends on the app.json keep rule
 * `-keep @interface expo.modules.** { *; }`: annotations exist only as runtime proxies, so without
 * it the optimizer decides the Records' @Field value is always null and Expo's argument conversion
 * throws – the app cannot open its database (verified 2026-10-17, fixed and re-verified 2026-10-20).
 */
const fs = require('fs');
const path = require('path');
const {
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const AGP_VERSION = '8.12.3';
const BASE_RULES_FILE = 'proguard-optimize-base.pro';
const BASE_RULES_SOURCE = path.join(__dirname, 'r8', BASE_RULES_FILE);
const DEFAULT_FILE = 'getDefaultProguardFile("proguard-android.txt")';
const BASE_RULES_REFERENCE = `"${BASE_RULES_FILE}"`;
const AGP_CLASSPATH = "classpath('com.android.tools.build:gradle')";
const AGP_CLASSPATH_RAISED = `classpath('com.android.tools.build:gradle:${AGP_VERSION}')`;
const FULL_MODE_KEY = 'android.enableR8.fullMode';

function useOptimizeFile(contents) {
  if (contents.includes(BASE_RULES_REFERENCE)) return contents;
  if (!contents.includes(DEFAULT_FILE)) {
    throw new Error(
      'withR8Optimization: proguard file line not found in android/app/build.gradle. ' +
        'The Expo template changed — re-check the R8 setup (technical-guides:Android-Release-Build.md).'
    );
  }
  return contents.replace(DEFAULT_FILE, BASE_RULES_REFERENCE);
}

function raiseAgp(contents) {
  if (contents.includes(AGP_CLASSPATH_RAISED)) return contents;
  if (!contents.includes(AGP_CLASSPATH)) {
    throw new Error(
      'withR8Optimization: versionless AGP classpath not found in android/build.gradle. ' +
        'The Expo template changed — re-check the AGP version (technical-guides:Android-Release-Build.md).'
    );
  }
  return contents.replace(AGP_CLASSPATH, AGP_CLASSPATH_RAISED);
}

function useR8CompatMode(properties) {
  return [
    ...properties.filter((item) => !(item.type === 'property' && item.key === FULL_MODE_KEY)),
    { type: 'property', key: FULL_MODE_KEY, value: 'false' },
  ];
}

module.exports = function withR8Optimization(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const target = path.join(config.modRequest.platformProjectRoot, 'app', BASE_RULES_FILE);
      await fs.promises.copyFile(BASE_RULES_SOURCE, target);
      return config;
    },
  ]);
  config = withAppBuildGradle(config, (config) => {
    config.modResults.contents = useOptimizeFile(config.modResults.contents);
    return config;
  });
  config = withGradleProperties(config, (config) => {
    config.modResults = useR8CompatMode(config.modResults);
    return config;
  });
  return withProjectBuildGradle(config, (config) => {
    config.modResults.contents = raiseAgp(config.modResults.contents);
    return config;
  });
};
module.exports.useOptimizeFile = useOptimizeFile;
module.exports.raiseAgp = raiseAgp;
module.exports.useR8CompatMode = useR8CompatMode;
module.exports.AGP_VERSION = AGP_VERSION;
module.exports.BASE_RULES_FILE = BASE_RULES_FILE;
module.exports.BASE_RULES_SOURCE = BASE_RULES_SOURCE;
