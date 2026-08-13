import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { initAds } from '../engine/ads';
import { usePro } from '../hooks/usePro';
import { ADMOB_BANNER_UNIT_ID, adsSupported } from '../config/monetization';

// Dev builds use Google's test unit; release uses the real per-platform unit
// from src/config/monetization.js. When a platform has no unit configured yet,
// `adsSupported` is false and this component renders nothing at all.
const BANNER_ID = __DEV__ ? TestIds.BANNER : ADMOB_BANNER_UNIT_ID;

export default function BannerAdBar() {
  const isPro = usePro();
  const [adsReady, setAdsReady] = useState(false);

  useEffect(() => {
    if (!adsSupported) return undefined;
    let mounted = true;
    // Waits for the UMP consent flow + MobileAds SDK init before any request.
    initAds().then(ok => { if (mounted) setAdsReady(ok === true); });
    return () => { mounted = false; };
  }, []);

  if (!adsSupported || isPro || !adsReady) return null;

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
