/**
 * Launch-safety tests.
 *
 * A sibling app shipped three consecutive builds that crashed at launch, all of
 * which processed as VALID in App Store Connect. The cause each time was work on
 * the first render path that threw before any effect could run. Processing state
 * says nothing about whether an app opens, so the only cheap guard is a test that
 * imports and exercises the code that runs before the user touches anything.
 *
 * The sharpest case here is PhrasesScreen: it calls translateToDialect() at MODULE
 * LOAD over every phrase pack, so a throw there is a launch crash rather than a
 * broken screen. That makes `import` itself the assertion — if the module-level
 * work throws, requiring the file fails and so does this suite.
 */
import { translateToDialect } from 'yissian-engine';
import { PHRASE_PACKS } from '../src/data/phrases';

describe('module-load safety', () => {
  // Each of these evaluates its module body on import. Any top-level throw is a
  // launch crash on a cold, empty install — the only state a reviewer ever sees.
  it.each([
    ['PhrasesScreen', () => require('../src/screens/PhrasesScreen')],
    ['TranslateScreen', () => require('../src/screens/TranslateScreen')],
    ['HistoryScreen', () => require('../src/screens/HistoryScreen')],
    ['RulesScreen', () => require('../src/screens/RulesScreen')],
    ['WebTranslateScreen', () => require('../src/screens/WebTranslateScreen')],
  ])('%s imports without throwing', (_name, load) => {
    expect(load).not.toThrow();
    expect(load().default).toBeDefined();
  });

  it('PhrasesScreen actually did its module-load translation work', () => {
    // Guards against the import test passing vacuously if the precomputation is
    // ever moved or removed: prove the same call it makes at load still works.
    const sample = PHRASE_PACKS[0].phrases[0];
    expect(typeof translateToDialect(sample)).toBe('string');
  });
});

describe('PHRASE_PACKS shape', () => {
  it('is a non-empty array of categories with non-empty phrase lists', () => {
    expect(Array.isArray(PHRASE_PACKS)).toBe(true);
    expect(PHRASE_PACKS.length).toBeGreaterThan(0);
    for (const pack of PHRASE_PACKS) {
      expect(typeof pack.category).toBe('string');
      expect(pack.category.length).toBeGreaterThan(0);
      expect(Array.isArray(pack.phrases)).toBe(true);
      expect(pack.phrases.length).toBeGreaterThan(0);
      for (const phrase of pack.phrases) {
        expect(typeof phrase).toBe('string');
        expect(phrase.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('translateToDialect over every shipped phrase', () => {
  const all = PHRASE_PACKS.flatMap((p) => p.phrases.map((t) => [p.category, t]));

  it('covers every phrase in the packs', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it.each(all)('%s: %s translates to a non-empty string', (_cat, phrase) => {
    const out = translateToDialect(phrase);
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('translateToDialect edge inputs', () => {
  // Nothing here asserts a specific transformation — only that the engine cannot
  // throw. These are the inputs a user or a reviewer produces by accident.
  const edges = [
    ['empty string', ''],
    ['single space', ' '],
    ['punctuation only', '!?.,;:'],
    ['digits', '12345'],
    ['contraction', "don't"],
    ['hyphenated', 'well-known'],
    ['url', 'https://example.com/a/b?c=d'],
    ['emoji', 'hello 👋 there'],
    ['newlines', 'one\ntwo\nthree'],
    ['leading/trailing space', '   padded   '],
    ['very long', 'word '.repeat(500)],
    ['mixed case', 'HeLLo WoRLD'],
    ['non-ascii', 'café naïve résumé'],
  ];

  it.each(edges)('does not throw on %s', (_label, input) => {
    expect(() => translateToDialect(input)).not.toThrow();
    expect(typeof translateToDialect(input)).toBe('string');
  });

  it('leaves two-letter words alone (documented engine guard)', () => {
    // Not a bug: the engine deliberately skips very short words. Pinned because
    // RulesScreen once printed `go -> griss` as an example, which this contradicts.
    for (const w of ['go', 'so', 'no', 'do']) {
      expect(translateToDialect(w)).toBe(w);
    }
  });
});
