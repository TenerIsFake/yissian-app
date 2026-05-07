package io.invertase.googlemobileads;

// Hand-written old-arch stand-in for the codegen-generated NativeAppModuleSpec.
// Codegen only runs when com.facebook.react is applied at the app level (new arch).
// With newArchEnabled=false the spec is never generated, so we provide it manually
// here using the same pattern the library uses for other old-arch module specs.

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReadableMap;

public abstract class NativeAppModuleSpec extends ReactContextBaseJavaModule {
  public static final String NAME = "RNAppModule";

  public NativeAppModuleSpec(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return NAME;
  }

  public abstract void initializeApp(ReadableMap options, ReadableMap appConfig, Promise promise);
  public abstract void setAutomaticDataCollectionEnabled(String appName, boolean enabled);
  public abstract void deleteApp(String appName, Promise promise);
  public abstract void eventsNotifyReady(boolean ready);
  public abstract void eventsGetListeners(Promise promise);
  public abstract void eventsPing(String eventName, ReadableMap eventBody, Promise promise);
  public abstract void eventsAddListener(String eventName);
  public abstract void eventsRemoveListener(String eventName, boolean all);
  public abstract void addListener(String eventName);
  public abstract void removeListeners(double count);
  public abstract void metaGetAll(Promise promise);
  public abstract void jsonGetAll(Promise promise);
  public abstract void preferencesSetBool(String key, boolean value, Promise promise);
  public abstract void preferencesSetString(String key, String value, Promise promise);
  public abstract void preferencesGetAll(Promise promise);
  public abstract void preferencesClearAll(Promise promise);
}
