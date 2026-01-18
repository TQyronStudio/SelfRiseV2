/**
 * EAS Build Hook: Add use_modular_headers! to Podfile
 * Fixes Firebase Swift pods compatibility with Expo static libraries
 * Runs after prebuild phase via eas.json hook
 */
const fs = require('fs');
const path = require('path');

const podfilePath = path.join(__dirname, '../ios/Podfile');

console.log('[fix-podfile] Running...');
console.log('[fix-podfile] Podfile path:', podfilePath);

if (!fs.existsSync(podfilePath)) {
  console.error('[fix-podfile] ❌ Podfile not found at:', podfilePath);
  process.exit(1);
}

let podfileContent = fs.readFileSync(podfilePath, 'utf-8');
console.log('[fix-podfile] Podfile length:', podfileContent.length);

if (podfileContent.includes('use_modular_headers!')) {
  console.log('[fix-podfile] ℹ️  use_modular_headers! already present');
  process.exit(0);
}

// Add use_modular_headers! after platform :ios declaration
const updated = podfileContent.replace(
  /(platform :ios, ['"][^'"]+['"])/,
  '$1\n\nuse_modular_headers!'
);

if (updated === podfileContent) {
  console.error('[fix-podfile] ⚠️  Failed to find platform :ios declaration, adding at beginning');
  fs.writeFileSync(podfilePath, 'use_modular_headers!\n\n' + podfileContent);
} else {
  fs.writeFileSync(podfilePath, updated);
}

console.log('[fix-podfile] ✅ Added use_modular_headers! to Podfile for Firebase compatibility');
