import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AdMobBanner, setTestDeviceIDAsync } from 'expo-ads-admob';

// ── Ad unit IDs ───────────────────────────────────────────────────────────────
// Replace REAL_* values after creating ad units in AdMob console.
// App ID goes in app.json → android.config.googleMobileAdsAppId
const REAL_BANNER_UNIT_ID = 'YOUR_REAL_BANNER_UNIT_ID';
const TEST_BANNER_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

const BANNER_ID = __DEV__ ? TEST_BANNER_UNIT_ID : REAL_BANNER_UNIT_ID;

export default function BannerAd() {
  useEffect(() => {
    if (__DEV__) setTestDeviceIDAsync('EMULATOR');
  }, []);

  // iOS not wired yet — no iOS AdMob app registered
  if (Platform.OS !== 'android') return null;

  return (
    <View style={styles.container}>
      <AdMobBanner
        bannerSize="banner"
        adUnitID={BANNER_ID}
        servePersonalizedAds={false}
        onDidFailToReceiveAdWithError={err => console.warn('AdMob:', err)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0f0f14',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
  },
});
