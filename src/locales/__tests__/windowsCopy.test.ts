/**
 * E10 texts (chapter, journal streak moment, multiplier window, goal done) render
 * in all three languages; the multiplier line prints the factor (E9/3); the
 * milestone titles carry no emoji — the window draws its own emblem (E10/4).
 */
import i18n from '../../config/i18n';
import en from '../en';
import de from '../de';
import es from '../es';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) => i18n.getFixedT(lang) as (key: string, options?: object) => string;

describe.each(LANGS)('E10 texts in %s', lang => {
  const t = fixed(lang);
  it.each([
    ['gamification.chapter.overline', {}],
    ['gamification.chapter.line', { from: 11, to: 20 }],
    ['journal.streakMoment.overline', {}],
    ['journal.streakMoment.days', { count: 14 }],
    ['gamification.multiplier.activatedLine', { factor: '2×' }],
    ['goals.completion.doneIn', { count: 1 }],
    ['goals.completion.doneIn', { count: 42 }],
  ] as [string, object][])('%s renders', (key, o) => {
    const text = t(key, o);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/[{}]/);
  });
});

it('milestone titles carry no emoji', () => {
  for (const locale of [en, de, es] as any[]) {
    const titles = Object.entries(locale.journal as Record<string, unknown>)
      .filter(([k]) => /^(streak|bonus)Milestone.*_title$/.test(k))
      .map(([, v]) => String(v));
    expect(titles.length).toBeGreaterThan(5);
    for (const title of titles) expect(title).not.toMatch(/[\u{1F300}-\u{1FAFF}☀-➿⭐]/u);
  }
});
