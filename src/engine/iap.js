import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { setProGlobal, loadProCache } from '../hooks/usePro';

// RevenueCat public SDK key (safe to ship — purchases are validated server-side
// against Google Play Billing).
const RC_API_KEY_ANDROID = 'goog_ehuZqFGtiLuwYRLReYQFPttwjel';
const ENTITLEMENT_ID = 'pro';

let configured = false;

function hasProEntitlement(customerInfo) {
  return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
}

export function initIAP() {
  try {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: RC_API_KEY_ANDROID });
    configured = true;
  } catch (err) {
    console.warn('RevenueCat configure failed:', err?.message ?? err);
  }

  // Load the last-known entitlement immediately (offline-friendly), then
  // refresh from RevenueCat in the background.
  loadProCache();
  refreshEntitlement().catch(() => {});
}

/** The current offering's first package (the $1.99 lifetime Pro unlock). */
export async function getProPackage() {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages?.[0] ?? null;
}

/**
 * Launch the Google Play purchase flow for Pro.
 * Returns true when Pro is active afterwards.
 * Throws with err.userCancelled === true when the user backs out.
 */
export async function purchasePro() {
  const pkg = await getProPackage();
  if (!pkg) throw new Error('Purchase is unavailable right now. Please try again later.');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const hasPro = hasProEntitlement(customerInfo);
  if (hasPro) setProGlobal(true);
  return hasPro;
}

/** Restore previous purchases; returns true when Pro is active. */
export async function restorePurchases() {
  const info = await Purchases.restorePurchases();
  const hasPro = hasProEntitlement(info);
  if (hasPro) setProGlobal(true);
  return hasPro;
}

/** Check the live entitlement without side effects. */
export async function checkEntitlement() {
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
