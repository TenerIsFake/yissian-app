import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Replace with real unit ID after creating a Banner ad unit in AdMob console.
// App ID is in app.json → plugins[react-native-google-mobile-ads].androidAppId
const REAL_BANNER_ID = 'ca-app-pub-9760203099492988/9979822598';
const BANNER_ID = __DEV__ ? TestIds.BANNER : REAL_BANNER_ID;

export default function BannerAdBar() {
  // iOS not registered in AdMob yet — skip until iOS App ID is obtained
  if (Platform.OS !== 'android') return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={err => console.warn('AdMob load error:', err.message)}
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
