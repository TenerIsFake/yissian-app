import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RC_API_KEY_ANDROID = 'goog_ehuZqFGtiLuwYRLReYQFPttwjel';
const ENTITLEMENT_ID = 'pro';
const STATE_KEY = 'yissian_pro_v1';

export function initIAP() {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: RC_API_KEY_ANDROID });
}

export async function purchasePro() {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages?.[0];
  if (!pkg) throw new Error('No offerings available — check RevenueCat dashboard');
  await Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  const info = await Purchases.restorePurchases();
  const hasPro = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  if (hasPro) {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify({ isPro: true }));
  }
  return hasPro;
}

export async function checkEntitlement() {
  const info = await Purchases.getCustomerInfo();
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}
