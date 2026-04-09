/**
 * Expo Config Plugin to fix Firebase "non-modular header" build error on iOS.
 * When using static frameworks (useFrameworks: "static"), Firebase pods
 * fail to compile because they include React Native headers that aren't
 * part of the Firebase module. This plugin disables strict module
 * verification for Firebase (RNFB*) targets specifically.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFirebaseModularHeadersFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

        const fixSnippet = `
    # [Firebase Fix] Disable strict module verification for RNFB pods
    installer.pods_project.targets.each do |target|
      if ['RNFBApp', 'RNFBAnalytics'].include?(target.name)
        target.build_configurations.each do |build_config|
          build_config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          build_config.build_settings['DEFINES_MODULE'] = 'NO'
        end
      end
    end`;

        if (!podfileContent.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
          // Insert before react_native_post_install in the post_install block
          podfileContent = podfileContent.replace(
            /(\s+)(react_native_post_install\()/,
            `${fixSnippet}\n\n$1$2`
          );

          fs.writeFileSync(podfilePath, podfileContent);
          console.log('✅ Added Firebase non-modular headers fix to Podfile');
        }
      }

      return config;
    },
  ]);
};
