/**
 * Plurals go through i18next's `_one` / `_other` keys, the only format this app
 * can read: there is no ICU plugin (`src/config/i18n.ts`). A string written as
 * `{count, plural, one {# day} other {# days}}` is shown to the user verbatim,
 * and neither tsc nor the parity test notices.
 */

import en from '../en';
import de from '../de';
import es from '../es';
import i18n from '../../config/i18n';

const LANGS = { en, de, es } as const;
type Lang = keyof typeof LANGS;

const strings = (value: unknown, path = ''): [string, string][] => {
  if (typeof value === 'string') return [[path, value]];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      strings(child, path ? `${path}.${key}` : key)
    );
  }
  return [];
};

const fixed = (lang: Lang) => i18n.getFixedT(lang) as (key: string, options?: object) => string;

describe('plural format in translations', () => {
  it.each(Object.keys(LANGS) as Lang[])('%s has no ICU syntax', lang => {
    const icu = strings(LANGS[lang])
      .filter(([, text]) => /\{\s*\w+\s*,\s*(plural|select|selectordinal)\s*,/.test(text))
      .map(([path]) => path);
    expect(icu).toEqual([]);
  });

  it.each(Object.keys(LANGS) as Lang[])('%s has no single-brace placeholders', lang => {
    const single = strings(LANGS[lang])
      .filter(([, text]) => /\{\w+\}/.test(text.replace(/\{\{[^{}]*\}\}/g, '')))
      .map(([path]) => path);
    expect(single).toEqual([]);
  });

  it.each([
    ['en', 1, '1 day with entries'],
    ['en', 5, '5 days with entries'],
    ['de', 1, '1 Tag mit Einträgen'],
    ['de', 5, '5 Tage mit Einträgen'],
    ['es', 1, '1 día con entradas'],
    ['es', 5, '5 días con entradas'],
  ] as const)('%s journal stats with %i', (lang, count, expected) => {
    expect(fixed(lang)('journal.stats.daysWithEntries', { count })).toBe(expected);
  });

  it.each([
    ['en', 1, '1 more day for 2x XP'],
    ['en', 3, '3 more days for 2x XP'],
    ['de', 1, '1 weiterer Tag für 2x XP'],
    ['es', 3, '3 días más para 2x XP'],
  ] as const)('%s multiplier countdown with %i', (lang, count, expected) => {
    expect(fixed(lang)('home.xpMultiplier.moreDays', { count })).toBe(expected);
  });

  it.each([
    ['en', 1, '1 habit with 7+ day streaks!'],
    ['de', 2, '2 Gewohnheiten mit 7+ Tage Serien!'],
    ['es', 2, '¡2 hábitos con rachas de 7+ días!'],
  ] as const)('%s streak champions with %i', (lang, count, expected) => {
    expect(fixed(lang)('home.habitTrends.streakChampionsDescription', { count })).toBe(expected);
  });

  it.each([
    ['en', '5 completions across 1 new habit! Great start!'],
    ['de', '5 Erledigungen über 1 neue Gewohnheit! Großartiger Start!'],
    ['es', '¡5 finalizaciones en 1 nuevo hábito! ¡Excelente comienzo!'],
  ] as const)('%s new habits line counts both numbers on its own', (lang, expected) => {
    const t = fixed(lang);
    expect(
      t('home.habitTrends.newHabitsProgress', {
        completions: t('home.habitTrends.newHabitsCompletions', { count: 5 }),
        habits: t('home.habitTrends.newHabitsCount', { count: 1 }),
      })
    ).toBe(expected);
  });
});
