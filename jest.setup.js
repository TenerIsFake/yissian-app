/**
 * AsyncStorage has no native module under Jest, so importing any screen that
 * reaches it (HistoryScreen -> useHistory, TranslateScreen -> usePro) throws at
 * require time. That is indistinguishable from the launch-crash these tests exist
 * to catch, so it has to be mocked here rather than worked around per-file.
 *
 * This is the mock the package ships for exactly this purpose — an in-memory
 * store, not a stub — so the cold-start path (no persisted data) is what tests see
 * by default, which is the state a reviewer's device is always in.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/**
 * The two ad/purchase SDKs are native modules with no JS fallback, so importing
 * any screen that reaches them throws under Jest. Mock only the surface the app
 * actually imports — a broader mock would hide a real import breaking.
 *
 * Deliberately NOT asserting on these: they stand in for native code that cannot
 * run here, so a passing test says the app's own module-level code is safe, not
 * that AdMob or RevenueCat work. Device verification is still the only proof of
 * that.
 */
jest.mock('react-native-google-mobile-ads', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => ({ initialize: jest.fn().mockResolvedValue([]) }),
    AdsConsent: { gatherConsent: jest.fn().mockResolvedValue({}) },
    BannerAd: (props) => React.createElement('BannerAd', props, null),
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER', BANNER: 'BANNER' },
    TestIds: { BANNER: 'ca-app-pub-3940256099942544/6300978111' },
  };
});

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', INFO: 'INFO', ERROR: 'ERROR' },
}));
