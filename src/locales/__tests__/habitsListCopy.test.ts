/**
 * The Habits list texts of the new look (migration E5) render with their real
 * parameters in all three languages (P29): no raw key, no leftover braces, and
 * the plural forms — including "paused today" (count 0) — pick the right text.
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) =>
  i18n.getFixedT(lang) as (key: string, options?: object) => string;

const CASES: [key: string, options: object][] = [
  ['habits.list.subline', {}],
  ['habits.list.week', {}],
  ['habits.list.doneOf', { count: 1, total: 5 }],
  ['habits.list.doneOf', { count: 3, total: 5 }],
  ['habits.list.bonusSection', {}],
  ['habits.list.bonusHint', {}],
  ['habits.list.pausedFor', { count: 0 }],
  ['habits.list.pausedFor', { count: 1 }],
  ['habits.list.pausedFor', { count: 6 }],
  ['habits.list.resume', {}],
  ['habits.list.makeupCovers', { day: 'Tue' }],
  ['habits.list.more', {}],
  ['habits.schedule.everyDay', {}],
  ['habits.actions.calendarStats', {}],
  ['habits.actions.pause', {}],
  ['habits.emptyStateWithCompletion.title', {}],
  ['habits.emptyStateWithCompletion.subtitle', {}],
];

describe.each(LANGS)('Habits list texts in %s', lang => {
  const t = fixed(lang);

  it.each(CASES)('%s renders cleanly', (key, options) => {
    const text = t(key, options);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/[{}]/);
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it('says "today" for a pause that starts today, the count otherwise', () => {
    const today = t('habits.list.pausedFor', { count: 0 });
    const six = t('habits.list.pausedFor', { count: 6 });
    expect(today).not.toMatch(/\d/);
    expect(six).toContain('6');
  });
});
