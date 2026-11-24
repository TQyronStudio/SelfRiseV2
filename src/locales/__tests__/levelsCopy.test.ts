/**
 * E9 texts (level panel, levels journey, harmony rule, rank names) render in all
 * three languages; the rule names the factor as a number (decision E9/3), DE says
 * "Routine" (E5/1), ES greets without gender (E9/4), every rank is translated.
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) => i18n.getFixedT(lang) as (key: string, options?: object) => string;
const RANKS = ['novice', 'beginner', 'learner', 'apprentice', 'adept', 'seeker', 'adventurer', 'practitioner',
  'pathfinder', 'specialist', 'veteran', 'expert', 'guardian', 'warden', 'challenger', 'master', 'elite',
  'champion', 'grandmaster', 'mythic'];

const CASES: [string, object][] = [
  ['gamification.progress.xpToLevel', { xp: '237', level: 17 }],
  ['gamification.xp.amount', { xp: '4 205' }],
  ...['close', 'allLevels', 'partHabits', 'partJournal', 'partGoals', 'harmonyHint', 'noteAction'].map(
    k => [`gamification.levelPanel.${k}`, {}] as [string, object]
  ),
  ['gamification.levelPanel.multiplier', { factor: '2×' }],
  ['gamification.levelPanel.timeLeftHours', { count: 5 }],
  ['gamification.levelPanel.timeLeftMinutes', { count: 1 }],
  ['gamification.levelPanel.harmonyDays', { done: 3, required: 7 }],
  ['gamification.levelPanel.harmonyNext', { count: 1 }],
  ['gamification.levelPanel.harmonyNext', { count: 4 }],
  ['gamification.levelPanel.partDone', { part: 'Habits' }],
  ['gamification.levelPanel.partOpen', { part: 'Habits' }],
  ['gamification.levelPanel.switchOn', { factor: '2×', hours: 24 }],
  ['gamification.levelPanel.readyTitle', { factor: '2×' }],
  ['gamification.multiplier.harmonyOverline', { count: 7 }],
  ['gamification.multiplier.boostTitle', { factor: '2', count: 48 }],
  ['gamification.multiplier.welcomeBack', {}],
  ['gamification.levels.journey.title', {}],
  ['gamification.levels.journey.ofTotal', { total: 100 }],
  ['gamification.levels.journey.range', { from: 1, to: 10 }],
  ['gamification.levels.journey.reached', { count: 3, size: 10 }],
  ['gamification.levels.journey.milestoneTrophy', { name: 'X' }],
  ['gamification.levels.journey.nextMilestone', { level: 25, count: 1 }],
  ['help.topics.multiplier', {}],
  ['help.rules.harmony.title', { days: 7, factor: '2×' }],
  ['help.rules.harmony.text', { days: 7, factor: '2×', hours: 24, cooldownDays: 7 }],
  ...RANKS.map(r => [`gamification.levels.rank.${r}`, {}] as [string, object]),
];

describe.each(LANGS)('E9 texts in %s', lang => {
  const t = fixed(lang);
  it.each(CASES)('%s renders', (key, o) => {
    const text = t(key, o);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/[{}]/);
  });
  it('the harmony rule prints the factor, not a word', () => {
    expect(t('help.rules.harmony.text', { days: 7, factor: '2×', hours: 24, cooldownDays: 7 })).toContain('2×');
  });
});

it('German says Routine, Spanish greets everyone', () => {
  expect(fixed('de')('gamification.levelPanel.partHabits')).toBe('Routinen');
  expect(fixed('es')('gamification.multiplier.welcomeBack')).not.toMatch(/Bienvenid/);
});
