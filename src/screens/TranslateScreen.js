import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, TextInput, Text, TouchableOpacity, ScrollView,
  StyleSheet, Share, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateToDialect, mergeOverrides } from 'yissian-engine';
import { useHistory } from '../hooks/useHistory';
import { usePro } from '../hooks/usePro';
import BannerAd from '../components/BannerAd';
import ProModal from '../components/ProModal';
import { iapSupported } from '../config/monetization';

const OVERRIDES_URL =
  'https://raw.githubusercontent.com/TenerIsFake/yissian-app/main/ota/yissian.json';
const OVERRIDES_CACHE_KEY = 'yissian_overrides_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function loadOverrides() {
  try {
    const cached = await AsyncStorage.getItem(OVERRIDES_CACHE_KEY);
    if (cached) {
      const { fetchedAt, overrides } = JSON.parse(cached);
      if (Date.now() - fetchedAt < CACHE_TTL_MS) {
        mergeOverrides(overrides);
        return;
      }
    }
    const res = await fetch(OVERRIDES_URL);
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data.overrides === 'object' && !Array.isArray(data.overrides)) {
      mergeOverrides(data.overrides);
      await AsyncStorage.setItem(
        OVERRIDES_CACHE_KEY,
        JSON.stringify({ fetchedAt: Date.now(), overrides: data.overrides }),
      );
    }
  } catch {
    // network failure or bad JSON — engine uses bundled defaults
  }
}

// ── Intensity ──────────────────────────────────────────────────────────────

const INTENSITY_STEPS = [0, 25, 50, 75, 100];
const INTENSITY_LABELS = ['Off', 'Light', 'Half', 'Most', 'Full'];

// At 25/50/75%, translate every Nth word using modular index:
// level 1 → every 4th, level 2 → half, level 3 → 3 out of 4
function translateWithIntensity(text, intensity) {
  if (intensity === 100) return translateToDialect(text);
  if (intensity === 0) return text;
  const level = INTENSITY_STEPS.indexOf(intensity);
  return text
    .split(' ')
    .map((word, i) => ((i % 4) < level ? translateToDialect(word) : word))
    .join(' ');
}

// ── Word chip tooltip ──────────────────────────────────────────────────────

function WordChips({ inputText, outputText }) {
  const [active, setActive] = useState(null);
  const inputWords = inputText.trim().split(/\s+/);
  const outputWords = outputText.trim().split(/\s+/);
  // Tooltips only make sense when words line up one-to-one.
  const aligned = inputWords.length === outputWords.length;

  return (
    <View style={styles.chips}>
      {outputWords.map((word, i) => {
        const isActive = active === i;
        const original = aligned ? inputWords[i] : null;
        const changed = original && original.toLowerCase() !== word.toLowerCase();
        return (
          <TouchableOpacity
            key={i}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => setActive(isActive ? null : i)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{word}</Text>
            {isActive && changed && (
              <Text style={styles.tooltipLabel}>{original}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function TranslateScreen() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [intensity, setIntensity] = useState(100);
  const [tooltipMode, setTooltipMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proVisible, setProVisible] = useState(false);
  const isPro = usePro();
  const { addEntry } = useHistory();
  const saveTimer = useRef(null);

  useEffect(() => { loadOverrides(); }, []);

  useEffect(() => {
    const result = input ? translateWithIntensity(input, intensity) : '';
    setOutput(result);

    clearTimeout(saveTimer.current);
    if (input.trim()) {
      saveTimer.current = setTimeout(() => addEntry(input, result), 800);
    }
    return () => clearTimeout(saveTimer.current);
  }, [input, intensity, addEntry]);

  const handleCopy = async () => {
    if (!output) return;
    await Clipboard.setStringAsync(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (!output) return;
    const card = `✨ Yissian Translator\n\n"${input}"\n  ↓\n"${output}"\n\nyissian-app`;
    await Share.share({ message: card });
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  const wordCountBadge = useMemo(() => {
    const level = INTENSITY_STEPS.indexOf(intensity);
    if (level <= 0 || level >= INTENSITY_STEPS.length - 1) return null;
    const words = input.trim() ? input.trim().split(/\s+/) : [];
    const total = words.length;
    if (total === 0) return null;
    const translated = words.filter((_, i) => (i % 4) < level).length;
    return `~${translated} of ${total} words translated`;
  }, [input, intensity]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Input</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          multiline
          placeholder="Type something…"
          placeholderTextColor="#666"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Intensity selector */}
        <View style={styles.intensityRow}>
          <Text style={styles.intensityLabel}>Intensity</Text>
          <View style={styles.intensityBtns}>
            {INTENSITY_STEPS.map((step, idx) => (
              <TouchableOpacity
                key={step}
                style={[styles.intensityBtn, intensity === step && styles.intensityBtnActive]}
                onPress={() => setIntensity(step)}
              >
                <Text style={[styles.intensityBtnText, intensity === step && styles.intensityBtnTextActive]}>
                  {INTENSITY_LABELS[idx]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {wordCountBadge && (
          <Text style={styles.wordCountBadge}>{wordCountBadge}</Text>
        )}

        {/* Output header row with tooltip mode toggle */}
        <View style={styles.outputHeader}>
          <Text style={styles.label}>Yissian</Text>
          <TouchableOpacity
            style={[styles.modeBtn, tooltipMode && styles.modeBtnActive]}
            onPress={() => setTooltipMode(m => !m)}
            disabled={!output}
          >
            <Text style={styles.modeBtnText}>📝 Words</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.outputBox}>
          {tooltipMode && output ? (
            <WordChips inputText={input} outputText={output} />
          ) : (
            <Text style={styles.outputText} selectable>
              {output || <Text style={styles.placeholder}>Translation appears here</Text>}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={handleCopy} disabled={!output}>
            <Text style={styles.btnText}>{copied ? 'Copied!' : 'Copy'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={handleShare} disabled={!output}>
            <Text style={styles.btnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnMuted]} onPress={handleClear} disabled={!input}>
            <Text style={styles.btnText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Only offer the upsell where purchases actually work — see
            src/config/monetization.js. */}
        {!isPro && iapSupported && (
          <TouchableOpacity style={styles.proRow} onPress={() => setProVisible(true)}>
            <Text style={styles.proRowText}>✨ Remove ads — $1.99</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <BannerAd />
      <ProModal visible={proVisible} onClose={() => setProVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f14' },
  container: { padding: 20, flexGrow: 1, backgroundColor: '#0f0f14' },
  label: {
    color: '#a78bfa', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11, letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a2e', color: '#e2e8f0', borderRadius: 10,
    padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#2d2d44', marginBottom: 16,
  },
  // Intensity
  intensityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  intensityLabel: {
    color: '#a78bfa', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
  },
  intensityBtns: { flex: 1, flexDirection: 'row', gap: 6 },
  intensityBtn: {
    flex: 1, borderRadius: 6, paddingVertical: 6,
    alignItems: 'center', backgroundColor: '#1a1a2e',
    borderWidth: 1, borderColor: '#2d2d44',
  },
  intensityBtnActive: { backgroundColor: '#5b21b6', borderColor: '#7c3aed' },
  intensityBtnText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  intensityBtnTextActive: { color: '#fff' },
  wordCountBadge: {
    color: '#7c3aed', fontSize: 12, textAlign: 'center',
    marginTop: -12, marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Output header
  outputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modeBtn: {
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2d2d44',
  },
  modeBtnActive: { backgroundColor: '#3b1f6e', borderColor: '#7c3aed' },
  modeBtnText: { color: '#a78bfa', fontSize: 12 },
  // Output box
  outputBox: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14,
    minHeight: 120, borderWidth: 1, borderColor: '#3d2d64', marginBottom: 24,
  },
  outputText: { color: '#c4b5fd', fontSize: 16, lineHeight: 24 },
  placeholder: { color: '#444' },
  // Word chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#2d1f52', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#4c3480', alignItems: 'center',
  },
  chipActive: { backgroundColor: '#5b21b6', borderColor: '#a78bfa' },
  chipText: { color: '#c4b5fd', fontSize: 15 },
  tooltipLabel: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
  // Actions
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, backgroundColor: '#5b21b6', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  btnMuted: { backgroundColor: '#2d2d44' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  // Pro upsell
  proRow: {
    marginTop: 16, alignItems: 'center', paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#3d2d64',
  },
  proRowText: { color: '#a78bfa', fontSize: 13, fontWeight: '600' },
});
