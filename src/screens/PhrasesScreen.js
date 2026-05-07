import React, { useMemo, useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet, Platform, TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { translateToDialect } from 'yissian-engine';
import { PHRASE_PACKS } from '../data/phrases';

// Translate all phrases once at module load — they are static strings
const SECTIONS = PHRASE_PACKS.map(pack => ({
  title: pack.category,
  data: pack.phrases.map(phrase => ({
    original: phrase,
    yissian: translateToDialect(phrase),
  })),
}));

function PhraseItem({ item }) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(item.yissian);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <Text style={styles.original}>{item.original}</Text>
        <Text style={styles.arrow}>↓</Text>
        <Text style={styles.yissian}>{item.yissian}</Text>
      </View>
      <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
        <Text style={styles.copyText}>Copy</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PhrasesScreen() {
  const [search, setSearch] = useState('');

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return SECTIONS;
    return SECTIONS
      .map(section => ({
        ...section,
        data: section.data.filter(
          item =>
            item.original.toLowerCase().includes(q) ||
            item.yissian.toLowerCase().includes(q)
        ),
      }))
      .filter(section => section.data.length > 0);
  }, [search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search phrases…"
          placeholderTextColor="#555"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>
      <SectionList
        sections={filteredSections}
        keyExtractor={(item, index) => item.original + index}
        renderItem={({ item }) => <PhraseItem item={item} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f14' },
  searchBar: {
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d44',
    backgroundColor: '#0f0f14',
  },
  searchInput: {
    backgroundColor: '#1a1a2e', color: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14,
    borderWidth: 1, borderColor: '#2d2d44',
  },
  list: { paddingBottom: 32 },
  sectionHeader: {
    backgroundColor: '#0f0f14', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#2d2d44',
  },
  sectionTitle: {
    color: '#a78bfa', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', marginHorizontal: 16, marginTop: 10,
    borderRadius: 10, borderWidth: 1, borderColor: '#2d2d44',
    paddingLeft: 14, paddingRight: 8, paddingVertical: 12,
  },
  cardBody: { flex: 1 },
  original: { color: '#94a3b8', fontSize: 13, marginBottom: 3 },
  arrow: { color: '#a78bfa', fontSize: 12, marginBottom: 3 },
  yissian: { color: '#c4b5fd', fontSize: 15, fontWeight: '500' },
  copyBtn: {
    backgroundColor: '#5b21b6', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8,
  },
  copyText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
