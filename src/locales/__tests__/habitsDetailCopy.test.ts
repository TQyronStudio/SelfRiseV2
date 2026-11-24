/**
 * The E6 texts (habit detail, composer, reorder, make-up rule) render in all
 * three languages: no raw key, no leftover braces — and the make-up rule
 * describes the marks the calendar really draws (ring + bracket, R-11), not the
 * old "golden check".
 */
import i18n from '../../config/i18n';
import { HabitColor } from '../../types/common';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) =>
  i18n.getFixedT(lang) as (key: string, options?: object) => string;

const KEYS: [string, object][] = [
  ...['currentStreak', 'bestStreak', 'rate', 'previousMonth', 'nextMonth', 'tapHint'].map(
    k => [`habits.detail.${k}`, {}] as [string, object]
  ),
  ...['done', 'bonus', 'paused', 'planned', 'todayOpen', 'none'].map(
    k => [`habits.dayStatus.${k}`, {}] as [string, object]
  ),
  ['habits.dayStatus.makeup', { day: 'Wed 22' }],
  ['habits.dayStatus.covered', { day: 'Thu 23' }],
  ...['title', 'editTitle', 'placeholder', 'previewName', 'ideas', 'create'].map(
    k => [`habits.composer.${k}`, {}] as [string, object]
  ),
  ['habits.schedule.weekdays', {}],
  ['habits.schedule.weekends', {}],
  ['habits.reorderMode.hint', {}],
  ...Object.values(HabitColor).map(c => [`habits.colors.${c}`, {}] as [string, object]),
  ['help.topics.makeUp', {}],
  ['help.rules.makeUp.title', {}],
  ['help.rules.makeUp.text', {}],
  ['help.allRules', {}],
];

describe.each(LANGS)('E6 texts in %s', lang => {
  const t = fixed(lang);

  it.each(KEYS)('%s renders cleanly', (key, options) => {
    const text = t(key, options);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/[{}]/);
  });

  it('the make-up rule names the ring, not a golden check', () => {
    const text = t('help.rules.makeUp.text');
    expect(text).not.toMatch(/gold|dorad/i);
    expect(text).toMatch(/ring|anillo/i);
  });

  it('German says Routine, never Gewohnheit', () => {
    if (lang !== 'de') return;
    for (const [key, o] of KEYS) expect(t(key, o)).not.toMatch(/Gewohnheit/);
  });
});
