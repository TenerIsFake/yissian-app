const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// expo-ads-admob@13 has two Gradle 8 incompatibilities:
//   1. `classifier = 'sources'` was removed — replace with archiveClassifier
//   2. `afterEvaluate { publishing { from components.release } }` fails in Gradle 8
//      because AGP finalizes components before afterEvaluate runs.
// We strip the publishing block entirely — consumer apps don't need Maven publishing.
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
      if (!fs.existsSync(buildGradle)) return config;

      let src = fs.readFileSync(buildGradle, 'utf8');

      // Fix 1: deprecated Jar.classifier property
      src = src.replace(/\bclassifier\s*=\s*'sources'/g, "archiveClassifier = 'sources'");

      // Fix 2: remove the androidSourcesJar task and the afterEvaluate/publishing block
      // which break under Gradle 8 (components.release unavailable in afterEvaluate)
      src = src.replace(/\/\/ Creating sources with comments[\s\S]*?^}/m, '');
      src = src.replace(/afterEvaluate\s*\{[\s\S]*?^}/m, '');

      fs.writeFileSync(buildGradle, src);
      return config;
    },
  ]);
};
