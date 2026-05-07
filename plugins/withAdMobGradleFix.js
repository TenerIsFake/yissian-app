const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// expo-ads-admob@13 build.gradle has two Gradle 8 incompatibilities:
//   1. `classifier = 'sources'` (removed in Gradle 8; use archiveClassifier)
//   2. `afterEvaluate { publishing { from components.release } }` — AGP finalizes
//      components before afterEvaluate runs in Gradle 8, causing a build error.
// We replace the entire file with a Gradle 8-compatible version.
const FIXED_BUILD_GRADLE = `apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

group = 'host.exp.exponent'
version = '13.0.0'

buildscript {
  def expoModulesCorePlugin = new File(project(":expo-modules-core").projectDir.absolutePath, "ExpoModulesCorePlugin.gradle")
  if (expoModulesCorePlugin.exists()) {
    apply from: expoModulesCorePlugin
    applyKotlinExpoModulesCorePlugin()
  }

  ext.safeExtGet = { prop, fallback ->
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
  }

  ext.getKotlinVersion = {
    if (ext.has("kotlinVersion")) {
      ext.kotlinVersion()
    } else {
      ext.safeExtGet("kotlinVersion", "1.6.10")
    }
  }

  repositories {
    mavenCentral()
  }

  dependencies {
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:\${getKotlinVersion()}")
  }
}

android {
  compileSdkVersion safeExtGet("compileSdkVersion", 34)

  compileOptions {
    sourceCompatibility JavaVersion.VERSION_11
    targetCompatibility JavaVersion.VERSION_11
  }

  kotlinOptions {
    jvmTarget = JavaVersion.VERSION_11.majorVersion
  }

  defaultConfig {
    minSdkVersion safeExtGet("minSdkVersion", 23)
    targetSdkVersion safeExtGet("targetSdkVersion", 34)
    versionCode 26
    versionName "13.0.0"
  }

  lintOptions {
    abortOnError false
  }
}

dependencies {
  implementation project(':expo-modules-core')
  implementation 'com.google.android.gms:play-services-ads:23.0.0'
  constraints {
    implementation('androidx.work:work-runtime:2.8.1') {
      because 'play-services-ads pulls an older version with PendingIntent FLAG_IMMUTABLE bug'
    }
  }
  implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:\${getKotlinVersion()}"
}
`;

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
        fs.writeFileSync(buildGradle, FIXED_BUILD_GRADLE, 'utf8');
      }
      return config;
    },
  ]);
};
