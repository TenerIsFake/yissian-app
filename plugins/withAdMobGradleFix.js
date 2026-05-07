const { withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } = require('@expo/config-plugins').AndroidConfig.Manifest;
const fs = require('fs');
const path = require('path');

const ADMOB_APP_ID_KEY = 'com.google.android.gms.ads.APPLICATION_ID';
const ADMOB_DELAY_INIT_KEY = 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT';

// Gradle 8-compatible replacement for expo-ads-admob@13's build.gradle.
// Removes the maven-publish/afterEvaluate block that breaks Gradle 8.
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

function withFixedBuildGradle(config) {
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
}

function withAdMobManifest(config) {
  return withAndroidManifest(config, (config) => {
    const appId = config.android?.config?.googleMobileAdsAppId ?? null;
    if (!appId) return config;
    const mainApp = getMainApplicationOrThrow(config.modResults);
    addMetaDataItemToMainApplication(mainApp, ADMOB_APP_ID_KEY, appId);
    addMetaDataItemToMainApplication(mainApp, ADMOB_DELAY_INIT_KEY, 'true');
    return config;
  });
}

module.exports = function withAdMobGradleFix(config) {
  config = withFixedBuildGradle(config);
  config = withAdMobManifest(config);
  return config;
};
