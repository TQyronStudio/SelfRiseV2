/**
 * E13 (Journal history and statistics) texts render in all three languages
 * with their parameters filled: no raw key, no leftover braces, no emoji where
 * a component draws the icon.
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) =>
  i18n.getFixedT(lang) as (key: string, options?: object) => string;

const KEYS = [
  'journal.calendar.legendComplete',
  'journal.calendar.legendBonus',
  'journal.calendar.legendPartial',
  'journal.calendar.legendPaid',
  'journal.calendar.paidDay',
  'journal.historyPage.previousDay',
  'journal.historyPage.nextDay',
  'journal.historyPage.clearSearch',
  'journal.stats.milestoneStar',
  'journal.stats.milestoneFlame',
  'journal.stats.milestoneCrown',
  'journal.stats.lastDays',
  'journal.stats.chartAtGoal',
  'journal.stats.chartAvg',
  'journal.stats.chartHint',
  'journal.stats.dailyGoal',
  'journal.stats.best',
  'journal.stats.daysWithEntries',
  'journal.errors.searchFailed',
  'journal.errors.deleteFailed',
];
const PARAMS = { count: 30, goal: 3, total: 30, avg: '2.4', days: 12 };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

describe.each(LANGS)('Journal history and statistics texts in %s', lang => {
  const t = fixed(lang);
  it.each(KEYS)('%s renders', key => {
    const text = t(key, PARAMS);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/\{\{|\}\}/);
  });
  it('the personal best carries no emoji', () => {
    expect(t('journal.stats.personalBest')).not.toMatch(EMOJI);
  });
  it('one day vs. many', () => {
    expect(t('journal.stats.best', { count: 1 })).not.toBe(
      t('journal.stats.best', { count: 2 }).replace('2', '1')
    );
  });
});
