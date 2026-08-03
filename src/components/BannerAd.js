import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { initAds } from '../engine/ads';
import { usePro } from '../hooks/usePro';

const REAL_BANNER_ID = 'ca-app-pub-9760203099492988/9979822598';
const BANNER_ID = __DEV__ ? TestIds.BANNER : REAL_BANNER_ID;

export default function BannerAdBar() {
  const isPro = usePro();
  const [adsReady, setAdsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Waits for the UMP consent flow + MobileAds SDK init before any request.
    initAds().then(ok => { if (mounted) setAdsReady(ok === true); });
    return () => { mounted = false; };
  }, []);

  if (Platform.OS !== 'android' || isPro || !adsReady) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={err => console.warn('AdMob:', err)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0f0f14',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#2d2d44',
    // Clear separation from the tab bar below, so the ad never crowds
    // navigation tap targets (Play ad-placement policy).
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
    marginBottom: 10,
  },
});
