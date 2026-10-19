// Guard rails for the Android release build (R8).
//
// Google Play requires >= 25 % optimization, obfuscation and shrinking for every
// upload from February 2027. R8 is switched on in app.json (expo-build-properties);
// these tests make sure it can't be switched off, or stripped of a keep rule,
// without a red test. Rules and reasons: technical-guides:Android-Release-Build.md
//
// The plugin tests run against the real Expo template (node_modules/expo/template.tgz),
// so an Expo upgrade that changes the Gradle files fails here instead of silently
// producing a build without optimization.

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('@expo/config-plugins', () => ({
  withAppBuildGradle: jest.fn(),
  withDangerousMod: jest.fn(),
  withGradleProperties: jest.fn(),
  withProjectBuildGradle: jest.fn(),
}));

const ROOT = path.join(__dirname, '..', '..');

type PluginEntry = string | [string, Record<string, unknown>];

interface AppJson {
  expo: { orientation?: string; plugins: PluginEntry[] };
}

interface AndroidBuildProperties {
  enableMinifyInReleaseBuilds?: boolean;
  extraProguardRules?: string;
}

interface GradleProperty {
  type: string;
  key?: string;
  value?: string;
}

interface R8OptimizationPlugin {
  (config: Record<string, unknown>): Record<string, unknown>;
  useOptimizeFile: (contents: string) => string;
  raiseAgp: (contents: string) => string;
  useR8CompatMode: (properties: GradleProperty[]) => GradleProperty[];
  AGP_VERSION: string;
  BASE_RULES_FILE: string;
  BASE_RULES_SOURCE: string;
}

interface GradleModConfig {
  modResults: { contents: string };
}

type GradleMod = (config: GradleModConfig) => GradleModConfig;
type PropertiesMod = (config: { modResults: GradleProperty[] }) => { modResults: GradleProperty[] };
type DangerousMod = [
  string,
  (config: { modRequest: { platformProjectRoot: string } }) => Promise<unknown>,
];

const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')) as AppJson;

function androidBuildProperties(): AndroidBuildProperties {
  const entry = appJson.expo.plugins.find(
    (plugin): plugin is [string, Record<string, unknown>] =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
  );
  if (!entry) throw new Error('expo-build-properties plugin is missing in app.json');
  return (entry[1]['android'] ?? {}) as AndroidBuildProperties;
}

function templateFile(relativePath: string): string {
  const archive = path.join(ROOT, 'node_modules', 'expo', 'template.tgz');
  return execFileSync('tar', ['-xzOf', archive, `package/android/${relativePath}`], {
    encoding: 'utf8',
  });
}

const DEFAULT_FILE = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZE_FILE = '"proguard-optimize-base.pro"';

// Every rule with the reason it exists — the failure message says why it matters.
const REQUIRED_RULES: Array<[string, string]> = [
  [
    '-keep class com.google.android.gms.internal.consent_sdk.** { *; }',
    'internals of the Google consent (UMP/GDPR) form',
  ],
  [
    '-keep class expo.modules.notifications.** { *; }',
    'expo-notifications stores scheduled reminders as Java-serialized objects under their ' +
      'class names, and its own keep rule never reaches the build (prebuilt AAR without ' +
      'proguard.txt). Without this rule, reminders saved before an update stop arriving.',
  ],
  [
    '-keep class expo.modules.ExpoModulesPackageList { *; }',
    'loaded via Class.forName — without it the app starts without any Expo module',
  ],
  [
    '-keep class expo.modules.adapters.react.apploader.RNHeadlessAppLoader { *; }',
    'named only in manifest meta-data, which the automatic manifest rules do not cover',
  ],
  [
    '-keep interface expo.modules.kotlin.records.Record',
    'empty marker interface Expo checks at runtime (isAssignableFrom); optimization may drop it',
  ],
  [
    '-keep public class * extends java.lang.Exception',
    'readable exception names in Crashlytics issue titles',
  ],
  ['-keepattributes SourceFile,LineNumberTable', 'line numbers in crash stack traces'],
  [
    '-renamesourcefileattribute SourceFile',
    'hides source file names in traces; the mapping file restores them',
  ],
];

describe('app.json – R8 in release builds', () => {
  test('R8 is enabled for release builds', () => {
    expect(androidBuildProperties().enableMinifyInReleaseBuilds).toBe(true);
  });

  const rules = (androidBuildProperties().extraProguardRules ?? '')
    .split('\n')
    .map((line) => line.trim());

  test.each(REQUIRED_RULES)('keeps the rule %s', (rule, reason) => {
    if (!rules.includes(rule)) {
      throw new Error(`Missing R8 rule "${rule}" in app.json → ${reason}`);
    }
  });

  test('the R8 optimization plugin is not registered yet (known breakage)', () => {
    // Verified 2026-10-17: with optimization on, Expo Record conversion fails and the app
    // cannot open its database. Register only after phase 8 of google-play-compliance-plan.md
    // passes on a device – then turn this test around.
    if (appJson.expo.plugins.includes('./plugins/withR8Optimization')) {
      throw new Error(
        'plugins/withR8Optimization is registered in app.json, but R8 optimization still breaks ' +
          'Expo Records (the database cannot open). See google-play-compliance-plan.md, phase 8.'
      );
    }
  });

  test('orientation is still locked to portrait (large-screen support is a separate task)', () => {
    // Changing this belongs to Part C of google-play-compliance-plan.md, not to R8 work.
    expect(appJson.expo.orientation).toBe('portrait');
  });
});

describe('plugins/withR8Optimization', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const plugin = require('../../plugins/withR8Optimization') as R8OptimizationPlugin;
  const appGradle = templateFile('app/build.gradle');
  const projectGradle = templateFile('build.gradle');
  const raisedAgp = `classpath('com.android.tools.build:gradle:${plugin.AGP_VERSION}')`;

  test('base rules optimize but never widen access modifiers', () => {
    // Access modification (protected -> public) changed the computed serialVersionUID of
    // expo-notifications' stored reminders, so reminders saved before the update were
    // deleted when they fired (verified on an emulator 2026-10-17).
    const ruleLines = fs
      .readFileSync(plugin.BASE_RULES_SOURCE, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-'));

    expect(path.basename(plugin.BASE_RULES_SOURCE)).toBe(plugin.BASE_RULES_FILE);
    expect(ruleLines).not.toContain('-allowaccessmodification');
    expect(ruleLines).not.toContain('-dontoptimize');
    expect(ruleLines).toContain('-keepclassmembers class * implements android.os.Parcelable {');
    expect(ruleLines).toContain('-keepclasseswithmembernames,includedescriptorclasses class * {');
  });

  test('switches R8 to compat mode exactly once and keeps other Gradle properties', () => {
    const result = plugin.useR8CompatMode([
      { type: 'property', key: 'android.enableMinifyInReleaseBuilds', value: 'true' },
      { type: 'property', key: 'android.enableR8.fullMode', value: 'true' },
      { type: 'comment', value: 'kept' },
    ]);

    expect(result.filter((item) => item.key === 'android.enableR8.fullMode')).toEqual([
      { type: 'property', key: 'android.enableR8.fullMode', value: 'false' },
    ]);
    expect(result).toContainEqual({
      type: 'property',
      key: 'android.enableMinifyInReleaseBuilds',
      value: 'true',
    });
    expect(result).toContainEqual({ type: 'comment', value: 'kept' });
  });

  test('switches the real template to the optimizing ProGuard file', () => {
    const result = plugin.useOptimizeFile(appGradle);

    expect(result).toContain(OPTIMIZE_FILE);
    expect(result).not.toContain(DEFAULT_FILE);
    expect(result.replace(OPTIMIZE_FILE, DEFAULT_FILE)).toBe(appGradle);
    expect(plugin.useOptimizeFile(result)).toBe(result);
  });

  test('raises AGP in the real template and changes nothing else', () => {
    const result = plugin.raiseAgp(projectGradle);

    expect(result).toContain(raisedAgp);
    expect(result.replace(raisedAgp, "classpath('com.android.tools.build:gradle')")).toBe(
      projectGradle
    );
    expect(plugin.raiseAgp(result)).toBe(result);
  });

  test('fails loudly when the template no longer has the expected lines', () => {
    expect(() => plugin.useOptimizeFile('android { }')).toThrow(/proguard file line not found/);
    expect(() => plugin.raiseAgp('buildscript { }')).toThrow(/AGP classpath not found/);
  });

  test('applies every change to the right file', async () => {
    const configPlugins = jest.requireMock('@expo/config-plugins') as {
      withAppBuildGradle: jest.Mock;
      withDangerousMod: jest.Mock;
      withGradleProperties: jest.Mock;
      withProjectBuildGradle: jest.Mock;
    };
    configPlugins.withDangerousMod.mockImplementation(
      (config: Record<string, unknown>, [platform, mod]: DangerousMod) => ({
        ...config,
        dangerousPlatform: platform,
        dangerousMod: mod,
      })
    );
    configPlugins.withAppBuildGradle.mockImplementation(
      (config: Record<string, unknown>, mod: GradleMod) => ({
        ...config,
        app: mod({ modResults: { contents: appGradle } }).modResults.contents,
      })
    );
    configPlugins.withGradleProperties.mockImplementation(
      (config: Record<string, unknown>, mod: PropertiesMod) => ({
        ...config,
        properties: mod({ modResults: [] }).modResults,
      })
    );
    configPlugins.withProjectBuildGradle.mockImplementation(
      (config: Record<string, unknown>, mod: GradleMod) => ({
        ...config,
        project: mod({ modResults: { contents: projectGradle } }).modResults.contents,
      })
    );

    const result = plugin({});

    expect(result['app']).toContain(OPTIMIZE_FILE);
    expect(result['project']).toContain(raisedAgp);
    expect(result['properties']).toEqual([
      { type: 'property', key: 'android.enableR8.fullMode', value: 'false' },
    ]);

    // The base rules file must land next to app/build.gradle, where the reference points.
    expect(result['dangerousPlatform']).toBe('android');
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'r8-plugin-'));
    fs.mkdirSync(path.join(projectRoot, 'app'));
    await (result['dangerousMod'] as DangerousMod[1])({
      modRequest: { platformProjectRoot: projectRoot },
    });
    expect(fs.readFileSync(path.join(projectRoot, 'app', plugin.BASE_RULES_FILE), 'utf8')).toBe(
      fs.readFileSync(plugin.BASE_RULES_SOURCE, 'utf8')
    );
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });
});

// Tripwires: these fail on the Expo/React Native upgrade that makes our R8 setup stale.
describe('tripwires for an Expo / React Native upgrade', () => {
  test('React Native still brings AGP 8.12.0', () => {
    const catalog = fs.readFileSync(
      path.join(ROOT, 'node_modules', '@react-native', 'gradle-plugin', 'gradle', 'libs.versions.toml'),
      'utf8'
    );
    const agp = /^agp\s*=\s*"([^"]+)"/m.exec(catalog)?.[1];
    if (agp !== '8.12.0') {
      throw new Error(
        `React Native now brings AGP ${agp ?? '(not found)'} instead of 8.12.0. Re-check ` +
          'plugins/withR8Optimization.js (the AGP raise may be stale) and re-measure R8 – ' +
          'see technical-guides:Android-Release-Build.md.'
      );
    }
  });

  test('the Expo template still uses proguard-android.txt (no optimization)', () => {
    if (!templateFile('app/build.gradle').includes(DEFAULT_FILE)) {
      throw new Error(
        'The Expo template no longer uses proguard-android.txt. It may optimize on its own now – ' +
          'decide whether plugins/withR8Optimization.js is still needed ' +
          '(technical-guides:Android-Release-Build.md).'
      );
    }
  });
});
