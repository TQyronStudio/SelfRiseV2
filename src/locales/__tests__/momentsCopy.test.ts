/**
 * E8 texts (one action, one moment): render in all three languages, the trophy
 * window speaks of TROPHIES (one word for one thing, decision E8/2), German says
 * "Trophäenhalle" and "Weiter" (decisions E8/1, E10/1).
 */
import i18n from '../../config/i18n';

const LANGS = ['en', 'de', 'es'] as const;
const fixed = (lang: string) => i18n.getFixedT(lang) as (key: string, options?: object) => string;

describe.each(LANGS)('E8 texts in %s', lang => {
  const t = fixed(lang);
  it.each([
    ['achievements.celebration.alsoUnlocked', {}],
    ['achievements.celebration.trophiesUnlocked', { count: 1 }],
    ['achievements.celebration.trophiesUnlocked', { count: 3 }],
    ['achievements.celebration.opensTrophyRoom', {}],
    ['gamification.multiplier.boostLine', { factor: '2,5', count: 12 }],
    ['gamification.multiplier.factorTag', { factor: '2,5' }],
  ] as [string, object][])('%s renders', (key, o) => {
    const text = t(key, o);
    expect(text).not.toBe(key);
    expect(text).not.toMatch(/[{}]/);
  });

  it('rarity titles say trophy, not achievement', () => {
    for (const r of ['common', 'rare', 'epic', 'legendary']) {
      expect(t(`achievements.celebration.rarity_${r}`)).toMatch(/troph|trofeo/i);
    }
  });
});

it('German: Trophäenhalle and Weiter', () => {
  const t = fixed('de');
  expect(t('achievements.celebration.opensTrophyRoom')).toContain('Trophäenhalle');
  expect(t('achievements.celebration.continue_button')).toBe('Weiter');
});
