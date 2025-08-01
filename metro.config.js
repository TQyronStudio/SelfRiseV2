const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Note: ExpoLinearGradient warning is benign with new architecture (newArchEnabled: true)
// The warning "Unable to get the view config for ExpoLinearGradient" is expected with
// Expo SDK 53 and new React Native architecture but doesn't affect functionality

module.exports = config;