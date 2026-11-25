/**
 * E12 (Journal) texts render in all three languages with their parameters
 * filled: no raw key, no leftover braces. Decision E12/1: calm sentences under
 * the day's count, and no emoji in texts whose icon a component draws (E12/7).
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) =>
  i18n.getFixedT(lang) as (key: string, options?: object) => string;

const KEYS = [
  'journal.subline',
  'journal.write.gratitudeHint',
  'journal.write.selfPraiseHint',
  'journal.bonusRoad.title',
  'journal.bonusRoad.toNext',
  'journal.bonusRoad.allCollected',
  'journal.entryCount',
  'journal.writingLocked',
  'journal.composer.anotherPrompt',
  'journal.quote.another',
  'journal.iconNames.star',
  'journal.iconNames.flame',
  'journal.iconNames.crown',
  'help.topics.journalDay',
  'help.topics.frozen',
  'help.rules.three.title',
  'help.rules.three.text',
  'help.rules.bonus.title',
  'help.rules.bonus.text',
  'help.rules.frozen.title',
  'help.rules.frozen.text',
  'journal.input.minLengthError',
  'common.errors.gratitude.failedToSave',
];
const PARAMS = { count: 2, perEntry: 20, star: 25, flame: 50, crown: 100, each: 8, maxDays: 3, min: 3 };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

describe.each(LANGS)('Journal texts in %s', lang => {
  const t = fixed(lang);
  it.each(KEYS)('%s renders', key => {
    const text = t(key, PARAMS);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/\{\{|\}\}/);
  });
  it.each([
    'journal.progress.dailyComplete',
    'journal.progress.bonusAmazing',
    'gratitude.bonus.label',
  ])('%s carries no emoji (the component draws icons)', key => {
    expect(t(key)).not.toMatch(EMOJI);
  });
  it('one entry vs. many', () => {
    expect(t('journal.entryCount', { count: 1 })).not.toBe(
      t('journal.entryCount', { count: 5 }).replace('5', '1')
    );
  });
});
