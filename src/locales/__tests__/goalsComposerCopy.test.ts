/**
 * E15 (goal composer and detail) texts render in all three languages with their
 * parameters filled, and the day / month counts pick the right form.
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) => i18n.getFixedT(lang) as (key: string, options?: object) => string;

const KEYS = [
  'goals.composer.title',
  'goals.composer.create',
  'goals.composer.previewTitle',
  'goals.composer.paceHint',
  'goals.composer.ideas',
  'goals.composer.deadline',
  'goals.composer.presetMonths',
  'goals.composer.presetYear',
  'goals.composer.presetPick',
  'goals.composer.inDays',
  'goals.detail.neededPerWeek',
  'goals.detail.yourPerWeek',
  'goals.detail.finish',
  'goals.detail.paceTitle',
  'goals.detail.plan',
  'goals.detail.you',
  'goals.detail.chartHint',
  'goals.detail.milestones',
  'goals.detail.reached',
  'help.topics.pace',
  'help.rules.pace.title',
  'help.rules.pace.text',
  'goals.errors.saveFailed',
];
const PARAMS = { count: 3, amount: '0.5', unit: 'books', date: '3 Nov' };

describe.each(LANGS)('Goal composer and detail texts in %s', lang => {
  const t = fixed(lang);
  it.each(KEYS)('%s renders', key => {
    const text = t(key, PARAMS);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/\{\{|\}\}/);
  });
  it('1 month vs. 3 months; today and tomorrow carry no number', () => {
    expect(t('goals.composer.presetMonths', { count: 1 })).not.toBe(
      t('goals.composer.presetMonths', { count: 3 }).replace('3', '1')
    );
    expect(t('goals.composer.inDays', { count: 0 })).not.toMatch(/\d/);
    expect(t('goals.composer.inDays', { count: 1 })).not.toMatch(/\d/);
  });
});
