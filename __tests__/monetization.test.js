/**
 * The monetization contract, pinned per platform.
 *
 * iOS currently ships ads but NOT purchases: the AdMob unit is configured while the
 * RevenueCat iOS key is still an empty string. That asymmetry is deliberate and
 * load-bearing — `adsSupported` and `iapSupported` are derived from whether each
 * credential is filled, so the app degrades quietly instead of calling
 * Purchases.configure() with no key or rendering a purchase button that cannot work.
 *
 * The risk is that someone "tidies up" the empty string, or pastes the Android
 * `goog_` key into the iOS slot (RevenueCat rejects it and the purchase flow
 * breaks). These tests make either change fail loudly here rather than in review.
 *
 * react-native is mocked down to Platform because monetization.js imports nothing
 * else, which keeps this file independent of the RN test environment.
 */

function loadFor(os) {
  let mod;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: {
        OS: os,
        select: (opts) => (os in opts ? opts[os] : opts.default),
      },
    }));
    mod = require('../src/config/monetization');
  });
  return mod;
}

afterEach(() => {
  jest.resetModules();
  jest.dontMock('react-native');
});

describe('iOS', () => {
  it('serves ads', () => {
    const m = loadFor('ios');
    expect(m.adsSupported).toBe(true);
    expect(m.ADMOB_BANNER_UNIT_ID).toMatch(/^ca-app-pub-\d+\/\d+$/);
  });

  it('does NOT support purchases while the RevenueCat iOS key is unset', () => {
    const m = loadFor('ios');
    expect(m.REVENUECAT_API_KEY).toBe('');
    expect(m.iapSupported).toBe(false);
  });

  it('never carries the Android key on iOS', () => {
    // RevenueCat rejects a goog_ key on an App Store app; this is the specific
    // wrong-fix that would look like it "enables" purchases and silently break them.
    const m = loadFor('ios');
    expect(m.REVENUECAT_API_KEY.startsWith('goog_')).toBe(false);
  });
});

describe('Android', () => {
  it('supports both ads and purchases', () => {
    const m = loadFor('android');
    expect(m.adsSupported).toBe(true);
    expect(m.iapSupported).toBe(true);
    expect(m.REVENUECAT_API_KEY).toMatch(/^goog_/);
    expect(m.ADMOB_BANNER_UNIT_ID).toMatch(/^ca-app-pub-\d+\/\d+$/);
  });
});

describe('unsupported platforms', () => {
  it('degrade to nothing rather than leaking another platform credential', () => {
    const m = loadFor('web');
    expect(m.REVENUECAT_API_KEY).toBe('');
    expect(m.ADMOB_BANNER_UNIT_ID).toBe('');
    expect(m.adsSupported).toBe(false);
    expect(m.iapSupported).toBe(false);
  });
});
