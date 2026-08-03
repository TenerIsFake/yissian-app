import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'yissian_history';
const MAX = 20;

export function useHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        } else {
          AsyncStorage.removeItem(KEY).catch(() => {});
        }
      } catch {
        // Corrupt storage — reset rather than breaking History forever.
        AsyncStorage.removeItem(KEY).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const save = (next) => AsyncStorage.setItem(KEY, JSON.stringify(next));

  const addEntry = useCallback(async (input, output) => {
    if (!input.trim() || !output.trim() || input === output) return;
    setHistory(prev => {
      const entry = { id: Date.now(), input, output, at: new Date().toISOString(), starred: false };
      const next = [entry, ...prev.filter(e => e.input !== input)].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const toggleStar = useCallback((id) => {
    setHistory(prev => {
      const next = prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e);
      save(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  // starred items float to the top, preserving recency order within each group
  const sorted = [
    ...history.filter(e => e.starred),
    ...history.filter(e => !e.starred),
  ];

  return { history: sorted, addEntry, toggleStar, clearHistory };
}
