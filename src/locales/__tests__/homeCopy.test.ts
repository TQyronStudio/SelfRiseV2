/**
 * E11 (Home) texts render in all three languages with their parameters filled:
 * no raw key, no leftover braces. Decisions: no night greeting (E11/1), DE
 * quick actions as whole words (E11/3).
 */
import i18n from '../../config/i18n';
import en from '../en';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) => i18n.getFixedT(lang) as (key: string, options?: object) => string;

function leaves(obj: unknown, path: string): string[] {
  if (typeof obj === 'string') return [path];
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
}
const home = (en as any).home;
const KEYS = [
  ...['hero', 'stats', 'insights', 'forYou', 'journalCard', 'greeting'].flatMap(k => leaves(home[k], `home.${k}`)),
  'home.subline',
  'home.customization.hint',
  'ui.dismiss',
  'ui.retrying',
].map(k => k.replace(/_(one|other|zero)$/, ''));
const UNIQUE = [...new Set(KEYS)];
const PARAMS = { count: 3, xp: 25, level: 4, done: 2, total: 5, days: 7, name: 'Read', percent: 12, day: 'Tue', habit: 'Read', index: 1, rate: 80, planned: 4, active: 5, goal: 3 };

describe.each(LANGS)('Home texts in %s', lang => {
  const t = fixed(lang);
  it.each(UNIQUE)('%s renders', key => {
    const text = t(key, PARAMS);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/\{\{|\}\}/);
  });
});

it('three greetings, no night one', () => {
  expect(home.greeting.night).toBeUndefined();
});

it('German quick actions are whole words', () => {
  const t = fixed('de');
  expect(t('home.quickActions.addHabit')).toBe('Neue Routine');
  expect(t('home.quickActions.addGoal')).toBe('Neues Ziel');
});
