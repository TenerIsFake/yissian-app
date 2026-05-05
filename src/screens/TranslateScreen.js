import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, Text, TouchableOpacity, ScrollView,
  StyleSheet, Share, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { translateToDialect, mergeOverrides } from 'yissian-engine';
import { useHistory } from '../hooks/useHistory';

const OVERRIDES_URL =
  'https://raw.githubusercontent.com/TenerIsFake/homepage-claude/master/yissian.json';

export default function TranslateScreen() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const { addEntry } = useHistory();
  const saveTimer = useRef(null);

  useEffect(() => {
    fetch(OVERRIDES_URL)
      .then(r => r.json())
      .then(d => { if (d.overrides) mergeOverrides(d.overrides); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const result = input ? translateToDialect(input) : '';
    setOutput(result);

    clearTimeout(saveTimer.current);
    if (input.trim()) {
      saveTimer.current = setTimeout(() => addEntry(input, result), 800);
    }
    return () => clearTimeout(saveTimer.current);
  }, [input, addEntry]);

  const handleCopy = async () => {
    if (!output) return;
    await Clipboard.setStringAsync(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (!output) return;
    await Share.share({ message: output });
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  return (
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

      <Text style={styles.label}>Yissian</Text>
      <View style={styles.outputBox}>
        <Text style={styles.outputText} selectable>
          {output || <Text style={styles.placeholder}>Translation appears here</Text>}
        </Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: '#0f0f14' },
  label: { color: '#a78bfa', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11, letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#1a1a2e', color: '#e2e8f0', borderRadius: 10,
    padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#2d2d44', marginBottom: 20,
  },
  outputBox: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14,
    minHeight: 120, borderWidth: 1, borderColor: '#3d2d64', marginBottom: 24,
  },
  outputText: { color: '#c4b5fd', fontSize: 16, lineHeight: 24 },
  placeholder: { color: '#444' },
  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, backgroundColor: '#5b21b6', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  btnMuted: { backgroundColor: '#2d2d44' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
