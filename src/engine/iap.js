import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { setProGlobal, loadProCache } from '../hooks/usePro';
import { REVENUECAT_API_KEY, ENTITLEMENT_ID, iapSupported } from '../config/monetization';

// The RevenueCat public SDK key is per-platform and lives in
// src/config/monetization.js. `iapSupported` is false when this platform has no
// key yet, in which case the SDK is never configured: configuring RevenueCat
// with a wrong-platform key breaks purchases outright, which is worse than
// shipping without IAP on that platform.

let configured = false;

function hasProEntitlement(customerInfo) {
  return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
}

/** True once RevenueCat is configured and purchases can actually be made. */
export function isIAPAvailable() {
  return iapSupported && configured;
}

export function initIAP() {
  if (iapSupported) {
    try {
      Purchases.setLogLevel(LOG_LEVEL.ERROR);
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      configured = true;
    } catch (err) {
      console.warn('RevenueCat configure failed:', err?.message ?? err);
    }
  } else {
    console.warn('RevenueCat: no API key for this platform — in-app purchases are disabled.');
  }

  // Load the last-known entitlement immediately (offline-friendly), then
  // refresh from RevenueCat in the background. This still runs when IAP is
  // unavailable so every screen gets a definite (false) Pro value instead of
  // waiting forever on `null`.
  loadProCache();
  refreshEntitlement().catch(() => {});
}

/** The current offering's first package (the $1.99 lifetime Pro unlock). */
export async function getProPackage() {
  if (!isIAPAvailable()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages?.[0] ?? null;
}

/**
 * Launch the Google Play purchase flow for Pro.
 * Returns true when Pro is active afterwards.
 * Throws with err.userCancelled === true when the user backs out.
 */
export async function purchasePro() {
  if (!isIAPAvailable()) {
    throw new Error('Purchases are not available on this device yet.');
  }
  const pkg = await getProPackage();
  if (!pkg) throw new Error('Purchase is unavailable right now. Please try again later.');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const hasPro = hasProEntitlement(customerInfo);
  if (hasPro) setProGlobal(true);
  return hasPro;
}

/** Restore previous purchases; returns true when Pro is active. */
export async function restorePurchases() {
  if (!isIAPAvailable()) return false;
  const info = await Purchases.restorePurchases();
  const hasPro = hasProEntitlement(info);
  if (hasPro) setProGlobal(true);
  return hasPro;
}

/** Check the live entitlement without side effects. */
export async function checkEntitlement() {
  if (!isIAPAvailable()) return false;
  const info = await Purchases.getCustomerInfo();
  return hasProEntitlement(info);
}

/** Refresh the entitlement from RevenueCat and sync the shared Pro state. */
export async function refreshEntitlement() {
  if (!configured) return false;
  try {
    const hasPro = await checkEntitlement();
    setProGlobal(hasPro);
    return hasPro;
  } catch {
    // Offline — keep the cached value.
    return null;
  }
}
