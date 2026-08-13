import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { adsSupported } from '../config/monetization';

// Google requires a certified CMP (UMP) consent flow for EEA/UK users before
// any ads are requested. This module runs that flow once, then initializes the
// Mobile Ads SDK. Banners must await initAds() and render only on success.

let initPromise = null;

export function initAds() {
  if (!initPromise) {
    initPromise = (async () => {
      // No ad unit is configured for this platform, so there is nothing to
      // request — never touch the native Ads SDK in that case.
      if (!adsSupported) return false;

      try {
        // Shows the Google-certified UMP consent form when required (EEA/UK).
        await AdsConsent.gatherConsent();
      } catch (err) {
        // Consent gathering can fail offline or in unsupported regions —
        // continue and let canRequestAds/init decide.
        console.warn('UMP consent flow failed:', err?.message ?? err);
      }

      try {
        await mobileAds().initialize();
        return true;
      } catch (err) {
        console.warn('AdMob initialization failed:', err?.message ?? err);
        return false;
      }
    })();
  }
  return initPromise;
}
