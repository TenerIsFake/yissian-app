import { Platform } from 'react-native';

/**
 * Single source of truth for platform-specific monetization credentials.
 *
 * Nothing else in the app should branch on `Platform.OS` to decide whether ads
 * or purchases are possible. Instead it asks this module: `adsSupported` and
 * `iapSupported` are derived from whether the credentials for the *current*
 * platform are actually filled in. That means the day the iOS values below are
 * pasted in, iOS starts working with no other code changes — and until then,
 * iOS degrades quietly (no ads, no RevenueCat configure call, no crash).
 */

// ── RevenueCat public SDK keys ─────────────────────────────────────────────
// These are *public* SDK keys and are safe to ship: purchases are validated
// server-side by RevenueCat against Play Billing / StoreKit.
const RC_API_KEY_ANDROID = 'goog_ehuZqFGtiLuwYRLReYQFPttwjel';

// TODO(ios): paste the RevenueCat **iOS** public SDK key here. It begins with
// `appl_` and lives in RevenueCat → Project settings → API keys → the App Store
// app. Do NOT reuse the Android `goog_` key — RevenueCat rejects it and the
// purchase flow breaks. Leave this empty string until the real key exists.
const RC_API_KEY_IOS = '';

// ── AdMob banner ad unit IDs ───────────────────────────────────────────────
const ADMOB_BANNER_ANDROID = 'ca-app-pub-9760203099492988/9979822598';

// TODO(ios): paste the **iOS** AdMob banner ad unit ID here, from AdMob → Apps
// → (the iOS app) → Ad units. Format is `ca-app-pub-<publisher>/<unit>`, and the
// unit is app-specific — the Android unit above will not serve on iOS. Note the
// iOS app also needs its GADApplicationIdentifier set in app.json before ads can
// initialize. Leave this empty string until the real unit ID exists.
const ADMOB_BANNER_IOS = '';

/** Pick the value for the running platform; anything else (web) gets nothing. */
function forPlatform(androidValue, iosValue) {
  return Platform.select({ android: androidValue, ios: iosValue, default: '' }) || '';
}

/** RevenueCat public SDK key for the current platform ('' when unconfigured). */
export const REVENUECAT_API_KEY = forPlatform(RC_API_KEY_ANDROID, RC_API_KEY_IOS);

/** AdMob banner ad unit for the current platform ('' when unconfigured). */
export const ADMOB_BANNER_UNIT_ID = forPlatform(ADMOB_BANNER_ANDROID, ADMOB_BANNER_IOS);

/** RevenueCat entitlement that grants the ad-free experience. */
export const ENTITLEMENT_ID = 'pro';

/**
 * True when this platform has a real AdMob banner unit. Ads must not be
 * initialized or rendered when this is false.
 */
export const adsSupported = ADMOB_BANNER_UNIT_ID.length > 0;

/**
 * True when this platform has a real RevenueCat key. `Purchases.configure()`
 * must not be called when this is false — configuring with a wrong-platform key
 * is what breaks purchases, and it is worse than having no IAP at all.
 */
export const iapSupported = REVENUECAT_API_KEY.length > 0;
