const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// expo-ads-admob@13 uses `classifier = 'sources'` which was removed in Gradle 8.
// This plugin rewrites it to `archiveClassifier = 'sources'` at prebuild time.
module.exports = function withAdMobGradleFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const buildGradle = path.join(
        config.modRequest.projectRoot,
        'node_modules',
        'expo-ads-admob',
        'android',
        'build.gradle'
      );
      if (fs.existsSync(buildGradle)) {
        const original = fs.readFileSync(buildGradle, 'utf8');
        const patched = original.replace(
          /\bclassifier\s*=\s*'sources'/g,
          "archiveClassifier = 'sources'"
        );
        if (original !== patched) {
          fs.writeFileSync(buildGradle, patched);
        }
      }
      return config;
    },
  ]);
};
