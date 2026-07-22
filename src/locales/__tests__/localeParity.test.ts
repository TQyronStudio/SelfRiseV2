/**
 * Locale parity regression tests — EN is the master, DE and ES must mirror it.
 *
 * WHY THIS FILE EXISTS (super audit Fáze 12, N-12.1): TypeScript does NOT guard
 * translation completeness in this project, contrary to what the file headers
 * ("Coverage: 100%") suggest:
 *   - `src/locales/de/index.ts:15` and `es/index.ts:15` are typed
 *     `Partial<TranslationKeys>`, so a whole missing block is legal;
 *   - 15 of the largest blocks in each of them (home, habits, journal, goals,
 *     monthlyChallenge, settings, days, achievements, auth, gamification, help,
 *     notifications, social, challenges, gratitude) are cast `as any`;
 *   - `src/types/i18n.ts:1702` types the entire `achievements` block through an
 *     index signature ending in `| any`, so it is unchecked even in EN.
 *
 * Net effect: `tsc --noEmit` reports 0 errors while DE/ES silently drift. That is
 * exactly how `social.notifications.*` ended up EN-only. Removing the `as any`
 * casts would mean rewriting two ~4500-line files that currently work, so the
 * guard rail lives here instead — and it also covers what types cannot express
 * (empty strings, array length drift, incomplete plural pairs).
 *
 * If a test here fails, the fix is to add the missing translation — never to
 * relax the test.
 */

import en from '../en';
import de from '../de';
import es from '../es';

type Leaf = string | string[] | number | boolean;

/** Flattens a nested translation object into `a.b.c` → value pairs. */
const flatten = (obj: Record<string, any>, prefix = '', out: Record<string, Leaf> = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, out);
    } else {
      out[path] = value;
    }
  }
  return out;
};

const flat = {
  en: flatten(en as Record<string, any>),
  de: flatten(de as Record<string, any>),
  es: flatten(es as Record<string, any>),
};

const TRANSLATIONS: Array<'de' | 'es'> = ['de', 'es'];
const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];

describe('locale parity (EN master vs DE/ES)', () => {
  it.each(TRANSLATIONS)('%s has every key that EN has', (lang) => {
    const missing = Object.keys(flat.en).filter((key) => !(key in flat[lang]));
    expect(missing).toEqual([]);
  });

  it.each(TRANSLATIONS)('%s has no keys that EN does not have', (lang) => {
    const orphans = Object.keys(flat[lang]).filter((key) => !(key in flat.en));
    expect(orphans).toEqual([]);
  });

  it.each(['en', 'de', 'es'] as const)('%s has no empty translation values', (lang) => {
    const empty = Object.entries(flat[lang])
      .filter(([, value]) => typeof value === 'string' && value.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it.each(TRANSLATIONS)('%s array values have the same length as EN', (lang) => {
    const mismatched = Object.entries(flat.en)
      .filter(([key, value]) => {
        if (!Array.isArray(value)) return false;
        const other = flat[lang][key];
        return !Array.isArray(other) || other.length !== value.length;
      })
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });

  it('EN plural keys always come in complete _one/_other pairs', () => {
    const incomplete: string[] = [];
    for (const key of Object.keys(flat.en)) {
      if (key.endsWith('_one') && !(`${key.slice(0, -4)}_other` in flat.en)) {
        incomplete.push(`${key} (missing _other)`);
      }
      if (key.endsWith('_other') && !(`${key.slice(0, -6)}_one` in flat.en)) {
        incomplete.push(`${key} (missing _one)`);
      }
    }
    expect(incomplete).toEqual([]);
  });

  it.each(TRANSLATIONS)('%s mirrors every EN plural form', (lang) => {
    const missing = Object.keys(flat.en)
      .filter((key) => PLURAL_SUFFIXES.some((suffix) => key.endsWith(suffix)))
      .filter((key) => !(key in flat[lang]));
    expect(missing).toEqual([]);
  });
});
