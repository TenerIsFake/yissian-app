import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Linking, TouchableOpacity } from 'react-native';

// Must match extra.privacyPolicyUrl in app.json (no expo-constants dependency).
const SUPPORT_EMAIL = 'tenerjenkins@gmail.com';
const PRIVACY_POLICY_URL = 'https://tenerisfake.github.io/privacy.html';

// Exported so __tests__/rules-examples.test.js can assert every example against
// the engine. The screen previously listed ['go', 'griss']; the engine leaves
// two-letter words alone (go/so/no/do all pass through), so the app was printing
// a rule example it does not produce. Replaced with 'grow', which is verified.
export const RULES = [
  {
    suffix: '-iss',
    when: 'Short/front vowels',
    detail: 'a, e, i, bare-u, oo, ea, ei, ie, ai, ay',
    examples: [['hell', 'hiss'], ['moon', 'miss'], ['yeah', 'yiss']],
  },
  {
    suffix: '-riss',
    when: 'Back/round vowels',
    detail: 'o, ou, ow, ue, ui, ew, au, aw, oi, oy — r-glide suppressed if onset ends in r',
    examples: [['grow', 'griss'], ['boy', 'briss'], ['dark', 'driss']],
  },
  {
    suffix: '-rid',
    when: 'Completive class',
    detail: '-er, -le, -ness, -ment, -ful stripped → stem + rid\n' +
            '-ies, -ied, -ed, consonant+y → onset + id\n' +
            'R-colored short vowel (arm, park) → word + rid\n' +
            "n't contractions → no-apo form + rid\n" +
            'Magic-e long-u (cute, tube) → stem + rid',
    examples: [['better', 'bettrid'], ['arm', 'armrid'], ['cute', 'cutrid']],
  },
  {
    suffix: "-issin'",
    when: 'Gerunds',
    detail: 'Words ending -ing or -in\'',
    examples: [['running', "rissin'"], ['downloading', "dissin'"]],
  },
  {
    suffix: 'base + -ly',
    when: 'Adverbs',
    detail: 'Transform the base word, then re-attach -ly',
    examples: [['really', 'rissly'], ['quickly', 'quickridly']],
  },
  {
    suffix: 'stem + -riss',
    when: 'Magic-e long vowel (a/i/o)',
    detail: 'VCe words: keep full stem, append -riss (or -iss if onset ends r)',
    examples: [['blade', 'bladriss'], ['bite', 'bitriss'], ['mode', 'modriss']],
  },
];

const PRESERVED = 'Function words, numbers, IPs, and URLs are always passed through unchanged.';
const FUNCTION_SAMPLE = 'a, an, the, and, or, I, you, he, she, it, is, be, was…';

function RuleCard({ rule }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.suffix}>{rule.suffix}</Text>
        <Text style={styles.when}>{rule.when}</Text>
      </View>
      <Text style={styles.detail}>{rule.detail}</Text>
      <View style={styles.examples}>
        {rule.examples.map(([a, b]) => (
          <Text key={a} style={styles.example}>
            <Text style={styles.exIn}>{a}</Text>
            <Text style={styles.arrow}> → </Text>
            <Text style={styles.exOut}>{b}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function RulesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dialect Rules</Text>
      <Text style={styles.intro}>
        Every word keeps its <Text style={styles.hl}>onset</Text> (initial consonant cluster).
        The vowel nucleus + coda are replaced by a suffix chosen by the table below.
      </Text>

      {RULES.map(r => <RuleCard key={r.suffix} rule={r} />)}

      <View style={styles.card}>
        <Text style={styles.suffix}>Preserved verbatim</Text>
        <Text style={styles.detail}>{PRESERVED}</Text>
        <Text style={styles.example}><Text style={styles.exIn}>{FUNCTION_SAMPLE}</Text></Text>
      </View>

      <Text style={styles.footer}>
        Override table: ~45 hand-tuned words (steak, night, can't, it's, etc.) fetched from yissian.json.
      </Text>

      <View style={styles.card}>
        <Text style={styles.suffix}>Support & Privacy</Text>
        <Text style={styles.detail}>
          Questions, bug reports, or feedback? Get in touch. Translation happens entirely on
          your device — text you translate never leaves it. (The Web tab fetches the page at
          the address you enter, like any browser.)
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}>
          <Text style={styles.link}>✉️  {SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}>
          <Text style={styles.link}>🔒  Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f14' },
  content: { padding: 20, gap: 14 },
  heading: {
    color: '#e2e8f0', fontSize: 22, fontWeight: '700', marginBottom: 8,
  },
  intro: { color: '#94a3b8', fontSize: 14, lineHeight: 22, marginBottom: 4 },
  hl: { color: '#a78bfa', fontWeight: '600' },
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#2d2d44',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 6 },
  suffix: {
    color: '#a78bfa', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14, fontWeight: '700',
  },
  when: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  detail: { color: '#64748b', fontSize: 13, lineHeight: 20, marginBottom: 8 },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  example: { fontSize: 13 },
  exIn: { color: '#94a3b8' },
  arrow: { color: '#4b5563' },
  exOut: { color: '#c4b5fd', fontWeight: '600' },
  footer: { color: '#374151', fontSize: 12, lineHeight: 18, marginTop: 4 },
  link: { color: '#a78bfa', fontSize: 14, fontWeight: '600', paddingVertical: 6 },
});
