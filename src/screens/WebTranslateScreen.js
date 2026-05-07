import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { translateToDialect } from 'yissian-engine';

// ── HTML → structured blocks ───────────────────────────────────────────────

function innerText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Extract h1/h2/h3/p/li/blockquote blocks from raw HTML in document order.
// Returns [{ type, text }].
function extractBlocks(html) {
  const cleaned = html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');

  const pattern = /<(h1|h2|h3|p|li|blockquote|td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocks = [];

  for (const m of cleaned.matchAll(pattern)) {
    const text = innerText(m[2]);
    if (text.length > 1) blocks.push({ type: m[1].toLowerCase(), text });
  }

  return blocks;
}

// ── Block rendering ────────────────────────────────────────────────────────

function Block({ type, original, translated }) {
  const [showOriginal, setShowOriginal] = useState(false);

  const textStyle =
    type === 'h1' ? styles.h1 :
    type === 'h2' ? styles.h2 :
    type === 'h3' ? styles.h3 :
    type === 'li' ? styles.li :
    type === 'blockquote' ? styles.blockquote :
    styles.p;

  return (
    <TouchableOpacity onPress={() => setShowOriginal(v => !v)} activeOpacity={0.8}>
      <Text style={textStyle}>
        {type === 'li' ? '• ' : ''}{showOriginal ? original : translated}
      </Text>
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function WebTranslateScreen() {
  const [url, setUrl] = useState('');
  const [blocks, setBlocks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicSite, setDynamicSite] = useState(false);
  const scrollRef = useRef(null);

  const handleFetch = async () => {
    const target = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    if (!target) return;

    setLoading(true);
    setBlocks(null);
    setError(null);
    setDynamicSite(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });

    try {
      const res = await fetch(target, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!res.ok) throw new Error(`Server returned ${res.status} ${res.statusText}`);

      const html = await res.text();
      const extracted = extractBlocks(html);

      if (extracted.length === 0) {
        setDynamicSite(true);
        return;
      }

      setBlocks(extracted.map(b => ({ ...b, translated: translateToDialect(b.text) })));
    } catch (err) {
      setError({ message: err.message, url: target });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/article"
          placeholderTextColor="#555"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleFetch}
        />
        <TouchableOpacity
          style={[styles.goBtn, (!url.trim() || loading) && styles.goBtnDisabled]}
          onPress={handleFetch}
          disabled={!url.trim() || loading}
        >
          <Text style={styles.goBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.barHint}>
        Works best with Wikipedia, news articles, and blogs — not apps like Twitter/X, Reddit, YouTube, or Gmail that load content dynamically.
      </Text>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#a78bfa" size="large" />
            <Text style={styles.loadingText}>Fetching and translating…</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Couldn't load page</Text>
            <Text style={styles.errorMsg}>{error.message}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(error.url)}>
              <Text style={styles.errorUrl}>{error.url}</Text>
            </TouchableOpacity>
            <Text style={styles.errorHint}>Tap the URL above to open in your browser instead.</Text>
          </View>
        )}

        {blocks && (
          <Text style={styles.tapHint}>Tap any block to toggle original ↔ Yissian</Text>
        )}

        {blocks && blocks.map((b, i) => (
          <Block key={i} type={b.type} original={b.text} translated={b.translated} />
        ))}

        {dynamicSite && (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>⚙️</Text>
            <Text style={styles.emptyTitle}>No readable content</Text>
            <Text style={styles.emptyHint}>
              This site loads content with JavaScript, so the page arrives empty.{'\n\n'}
              Sites like these won't work:{'\n'}
              Twitter/X · Reddit · YouTube · Gmail · Instagram
            </Text>
            <Text style={styles.emptyWorksHint}>Try a Wikipedia article or a news site instead.</Text>
          </View>
        )}

        {!loading && !error && !blocks && !dynamicSite && (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🌐</Text>
            <Text style={styles.emptyTitle}>Page Translator</Text>
            <Text style={styles.emptyHint}>
              Enter any article or blog URL above.{'\n'}
              The page text will be rendered in Yissian dialect.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f14' },
  bar: {
    flexDirection: 'row', padding: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#2d2d44',
    backgroundColor: '#0f0f14',
  },
  urlInput: {
    flex: 1, backgroundColor: '#1a1a2e', color: '#e2e8f0',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, borderWidth: 1, borderColor: '#2d2d44',
    fontFamily: MONO,
  },
  goBtn: {
    backgroundColor: '#5b21b6', borderRadius: 8,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  goBtnDisabled: { backgroundColor: '#2d2d44' },
  goBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { padding: 20, paddingBottom: 48, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  loadingText: { color: '#64748b', marginTop: 16, fontSize: 14 },
  emptyIcon: { fontSize: 40, marginBottom: 16 },
  emptyTitle: { color: '#e2e8f0', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptyHint: { color: '#4b5563', textAlign: 'center', lineHeight: 22 },
  emptyWorksHint: { color: '#5b21b6', textAlign: 'center', marginTop: 14, fontSize: 13 },
  barHint: {
    color: '#4b5563', fontSize: 11, textAlign: 'center',
    paddingHorizontal: 16, paddingBottom: 8, lineHeight: 16,
  },
  errorCard: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 18,
    borderWidth: 1, borderColor: '#7f1d1d',
  },
  errorTitle: { color: '#fca5a5', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  errorMsg: { color: '#94a3b8', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  errorUrl: {
    color: '#a78bfa', fontSize: 13, fontFamily: MONO,
    textDecorationLine: 'underline', marginBottom: 10,
  },
  errorHint: { color: '#4b5563', fontSize: 12 },
  tapHint: {
    color: '#4b5563', fontSize: 11, fontFamily: MONO,
    letterSpacing: 1, textAlign: 'center', marginBottom: 20,
    textTransform: 'uppercase',
  },
  h1: { color: '#e2e8f0', fontSize: 24, fontWeight: '800', marginBottom: 12, lineHeight: 32 },
  h2: { color: '#c4b5fd', fontSize: 20, fontWeight: '700', marginBottom: 10, marginTop: 8, lineHeight: 28 },
  h3: { color: '#a78bfa', fontSize: 17, fontWeight: '600', marginBottom: 8, marginTop: 6 },
  p: { color: '#cbd5e1', fontSize: 15, lineHeight: 24, marginBottom: 14 },
  li: { color: '#cbd5e1', fontSize: 15, lineHeight: 24, marginBottom: 8, paddingLeft: 8 },
  blockquote: {
    color: '#94a3b8', fontSize: 15, lineHeight: 24, marginBottom: 14,
    paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: '#5b21b6', fontStyle: 'italic',
  },
});
