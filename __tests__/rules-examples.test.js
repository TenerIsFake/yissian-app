/**
 * The Rules screen teaches users the suffix system by example. If an example does
 * not match what the engine actually produces, the app contradicts itself in front
 * of the user — and in front of App Review.
 *
 * That had already happened: the screen listed `go -> griss`, but the engine leaves
 * two-letter words alone, so `go` came back as `go`. Twelve of thirteen examples
 * were right, which is exactly why nobody noticed the thirteenth.
 *
 * These assertions read RULES from the screen itself rather than restating the
 * pairs, so a new example is covered the moment it is added.
 */
import { translateToDialect } from 'yissian-engine';
import { RULES } from '../src/screens/RulesScreen';

const pairs = RULES.flatMap((rule) =>
  (rule.examples || []).map(([input, expected]) => [rule.suffix, input, expected]),
);

describe('RulesScreen examples match the engine', () => {
  it('exports rules with at least one example', () => {
    expect(RULES.length).toBeGreaterThan(0);
    expect(pairs.length).toBeGreaterThan(0);
  });

  it.each(pairs)('rule %s: %s -> %s', (_suffix, input, expected) => {
    expect(translateToDialect(input)).toBe(expected);
  });

  it('every rule has the fields the screen renders', () => {
    for (const rule of RULES) {
      expect(typeof rule.suffix).toBe('string');
      expect(typeof rule.when).toBe('string');
      expect(typeof rule.detail).toBe('string');
      expect(rule.suffix.length).toBeGreaterThan(0);
    }
  });
});
