/**
 * Expo Config Plugin to add use_modular_headers! to Podfile
 * This is required for Firebase to work with static frameworks in Expo
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        // Add use_modular_headers! after platform :ios line if not already present
        if (!podfileContent.includes('use_modular_headers!')) {
          podfileContent = podfileContent.replace(
            /(platform :ios, ['"][0-9.]+['"])/,
            `$1\n  use_modular_headers!`
          );

          fs.writeFileSync(podfilePath, podfileContent);
          console.log('✅ Added use_modular_headers! to Podfile for Firebase compatibility');
        }
      }

      return config;
    },
  ]);
};
