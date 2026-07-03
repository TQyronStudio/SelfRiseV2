const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude ios/ and android/ native folders from Metro bundler
const escapedRoot = __dirname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const additionalExclusions = [
  new RegExp(`${escapedRoot}/ios/.*`),
  new RegExp(`${escapedRoot}/android/.*`),
];

const existingBlockList = config.resolver?.blockList || [];
config.resolver.blockList = Array.isArray(existingBlockList)
  ? [...existingBlockList, ...additionalExclusions]
  : [existingBlockList, ...additionalExclusions];

// NOTE (audit N22): an SDK 53-era console.warn/log monkey-patch used to live
// here, suppressing "NativeViewManagerAdapter for ExpoLinearGradient" warnings.
// Removed on SDK 55 (New Architecture only) — the underlying issue was fixed
// upstream, and the patch was swallowing every message mentioning
// 'expo-modules-core', which could hide real errors. If the gradient warning
// ever reappears in dev, it is benign; do NOT reintroduce a blanket filter.

module.exports = config;