/**
 * Live text bugs fixed 2026-11-24 (design-migration-plan 4.6 item 13): each
 * number gets its own singular/plural, error texts fit both journal entry
 * types and name what really happened.
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) =>
  i18n.getFixedT(lang) as (key: string, options?: object) => string;

const clean = (text: string, key: string) => {
  expect(text).not.toBe(key);
  expect(text).not.toMatch(/[{}]|\$t\(/);
};

describe.each(LANGS)('%s', lang => {
  const t = fixed(lang);

  it('the frozen streak: days and ads each have their own plural', () => {
    // Two days frozen, one already warmed up → one ad left.
    const text = t('journal.warmUp.frozenMessage', { count: 2, adsNeeded: 1 });
    clean(text, 'journal.warmUp.frozenMessage');
    expect(text).toContain(t('journal.warmUp.adsCount', { count: 1 }));
    expect(text).not.toContain(t('journal.warmUp.adsCount', { count: 2 }).replace('2', '1'));
    const many = t('journal.warmUp.frozenMessage', { count: 3, adsNeeded: 3 });
    expect(many).toContain(t('journal.warmUp.adsCount', { count: 3 }));
  });

  it.each([
    'home.recommendationCards.goals.timelineCheck.description',
    'journal.stats.best',
    'journal.stats.bestStreak',
  ])('%s: one day is singular', key => {
    const one = t(key, { count: 1, goalTitle: 'Run' });
    const five = t(key, { count: 5, goalTitle: 'Run' });
    clean(one, key);
    clean(five, key);
    expect(one).toContain('1');
    expect(five).toContain('5');
    expect(one.replace('1', '5')).not.toBe(five);
  });

  it('journal input errors fit self-praise too and show the minimum', () => {
    const empty = t('journal.input.emptyError');
    const short = t('journal.input.minLengthError', { min: 3 });
    clean(empty, 'journal.input.emptyError');
    clean(short, 'journal.input.minLengthError');
    expect(short).toContain('3');
    expect(`${empty} ${short}`).not.toMatch(/gratitud|dankbarkeit/i);
  });

  it('a failed reset does not send the user to a support that does not exist', () => {
    expect(t('journal.rescue.resetFailed.message')).not.toMatch(/support|soporte/i);
  });

  it('a failed progress delete says delete, not add', () => {
    const text = t('common.errors.goals.failedToDeleteProgress');
    clean(text, 'common.errors.goals.failedToDeleteProgress');
    expect(text).not.toBe(t('common.errors.goals.failedToAddProgress'));
  });
});
