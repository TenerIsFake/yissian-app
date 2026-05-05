import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yissian_history';
const MAX = 20;

export function useHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) setHistory(JSON.parse(raw));
    });
  }, []);

  const addEntry = useCallback(async (input, output) => {
    if (!input.trim() || !output.trim() || input === output) return;
    setHistory(prev => {
      const entry = { id: Date.now(), input, output, at: new Date().toISOString() };
      const next = [entry, ...prev.filter(e => e.input !== input)].slice(0, MAX);
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
}
