import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { AdMobBanner, setTestDeviceIDAsync } from 'expo-ads-admob';

const REAL_BANNER_ID = 'ca-app-pub-9760203099492988/9979822598';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

const BANNER_ID = __DEV__ ? TEST_BANNER_ID : REAL_BANNER_ID;

export default function BannerAdBar() {
  useEffect(() => {
    if (__DEV__) setTestDeviceIDAsync('EMULATOR');
  }, []);

  if (Platform.OS !== 'android') return null;

  return (
    <View style={styles.container}>
      <AdMobBanner
        bannerSize="smartBannerPortrait"
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
