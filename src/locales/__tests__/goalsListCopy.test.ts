/**
 * E14 (Goals list, pace card, quick logging) texts render in all three
 * languages with their parameters filled, and the day counts pick the right form.
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) =>
  i18n.getFixedT(lang) as (key: string, options?: object) => string;

const KEYS = [
  'goals.subline',
  'goals.pace.onPace',
  'goals.pace.ahead',
  'goals.pace.behind',
  'goals.pace.overdue',
  'goals.pace.daysLeft',
  'goals.card.by',
  'goals.card.noDeadline',
  'goals.card.other',
  'goals.log.undo',
  'goals.log.logged',
  'goals.log.milestone',
  'goals.log.noXpLeft',
  'goals.deadlines.next',
];
const PARAMS = { count: 6, date: '31 Dec', amount: '+1 book', percent: 50, title: 'Read' };

describe.each(LANGS)('Goals list texts in %s', lang => {
  const t = fixed(lang);
  it.each(KEYS)('%s renders', key => {
    const text = t(key, PARAMS);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/\{\{|\}\}/);
  });
  it('days left: today, one, many', () => {
    const zero = t('goals.pace.daysLeft', { count: 0 });
    expect(zero).not.toMatch(/0/);
    expect(t('goals.pace.daysLeft', { count: 1 })).not.toBe(
      t('goals.pace.daysLeft', { count: 2 }).replace('2', '1')
    );
  });
  it('next deadline: today and tomorrow say no number', () => {
    expect(t('goals.deadlines.next', { count: 0, title: 'Read' })).not.toMatch(/\d/);
    expect(t('goals.deadlines.next', { count: 1, title: 'Read' })).not.toMatch(/\d/);
  });
});
