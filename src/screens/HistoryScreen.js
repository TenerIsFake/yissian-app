import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useHistory } from '../hooks/useHistory';

function HistoryItem({ item, onStar }) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(item.output);
  };

  const date = new Date(item.at).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={[styles.card, item.starred && styles.cardStarred]}
      onPress={handleCopy}
      activeOpacity={0.7}
    >
      <TouchableOpacity style={styles.starBtn} onPress={() => onStar(item.id)} hitSlop={8}>
        <Text style={styles.starIcon}>{item.starred ? '⭐' : '☆'}</Text>
      </TouchableOpacity>
      <Text style={styles.inputText} numberOfLines={2}>{item.input}</Text>
      <Text style={styles.arrow}>↓</Text>
      <Text style={styles.outputText} numberOfLines={2}>{item.output}</Text>
      <Text style={styles.date}>{date} · tap to copy</Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { history, toggleStar, clearHistory } = useHistory();

  const confirmClear = () => {
    Alert.alert('Clear history?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  };

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No translations yet.</Text>
        <Text style={styles.emptyHint}>Head to the Translate tab to get started.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <HistoryItem item={item} onStar={toggleStar} />}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <TouchableOpacity style={styles.clearBtn} onPress={confirmClear}>
            <Text style={styles.clearText}>Clear history</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f14' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#2d2d44',
  },
  cardStarred: { borderColor: '#7c3aed', backgroundColor: '#1e1a35' },
  starBtn: { position: 'absolute', top: 10, right: 12 },
  starIcon: { fontSize: 18 },
  inputText: { color: '#94a3b8', fontSize: 14, marginBottom: 4, paddingRight: 28 },
  arrow: { color: '#a78bfa', marginVertical: 2 },
  outputText: { color: '#c4b5fd', fontSize: 15, fontWeight: '500', marginBottom: 6 },
  date: { color: '#4b5563', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f14', padding: 32 },
  emptyText: { color: '#e2e8f0', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { color: '#4b5563', textAlign: 'center' },
  clearBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  clearText: { color: '#ef4444', fontSize: 14 },
});
