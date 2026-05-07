const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ADMOB_APP_ID = 'ca-app-pub-9760203099492988~3292564703';

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

const META_DATA_XML = `    <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${ADMOB_APP_ID}"/>
    <meta-data android:name="com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT" android:value="true"/>`;

module.exports = function withAdMobGradleFix(config) {
  // Pass 1: rewrite expo-ads-admob build.gradle (runs in node_modules, pre-Gradle)
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const buildGradle = path.join(
        config.modRequest.projectRoot,
        'node_modules', 'expo-ads-admob', 'android', 'build.gradle'
      );
      if (fs.existsSync(buildGradle)) {
        fs.writeFileSync(buildGradle, FIXED_BUILD_GRADLE, 'utf8');
      }
      return config;
    },
  ]);

  // Pass 2: inject AdMob APPLICATION_ID into the generated AndroidManifest.xml
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'AndroidManifest.xml'
      );
      if (fs.existsSync(manifestPath)) {
        let manifest = fs.readFileSync(manifestPath, 'utf8');
        if (!manifest.includes('gms.ads.APPLICATION_ID')) {
          manifest = manifest.replace('</application>', META_DATA_XML + '\n  </application>');
          fs.writeFileSync(manifestPath, manifest, 'utf8');
        }
      }
      return config;
    },
  ]);

  return config;
};
