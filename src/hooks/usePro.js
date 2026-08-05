import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATE_KEY = 'yissian_pro_v1';

// Module-level Pro state shared by every screen. `null` means "not loaded yet".
let cachedPro = null;
const listeners = new Set();

function notify(value) {
  listeners.forEach(listener => listener(value));
}

/** Update the Pro entitlement everywhere and persist it. */
export function setProGlobal(isPro) {
  cachedPro = !!isPro;
  notify(cachedPro);
  AsyncStorage.setItem(STATE_KEY, JSON.stringify({ isPro: cachedPro })).catch(() => {});
}

/** Read the persisted Pro flag into the module cache (used before RC responds). */
export async function loadProCache() {
  if (cachedPro !== null) return cachedPro;
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (cachedPro === null) {
      cachedPro = raw ? !!JSON.parse(raw).isPro : false;
      notify(cachedPro);
    }
  } catch {
    if (cachedPro === null) {
      cachedPro = false;
      notify(cachedPro);
    }
    AsyncStorage.removeItem(STATE_KEY).catch(() => {});
  }
  return cachedPro;
}

/** React hook: current Pro entitlement (defaults to false until loaded). */
export function usePro() {
  const [isPro, setIsPro] = useState(cachedPro === true);

  useEffect(() => {
    const listener = value => setIsPro(value === true);
    listeners.add(listener);
    if (cachedPro === null) {
      loadProCache();
    } else {
      setIsPro(cachedPro === true);
    }
    return () => listeners.delete(listener);
  }, []);

  return isPro;
}
