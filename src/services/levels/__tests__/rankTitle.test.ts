/** Rank titles follow the app's level names, translated (E9/1). */
import { getLevelInfo } from '@/src/services/levelCalculation';
import { rankOf, rankTitle } from '../rankTitle';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

it('matches the internal English title for every level 1–100', () => {
  for (let level = 1; level <= 100; level++) {
    const { rank, step } = rankOf(level);
    const english = rank === 'grandmaster' ? 'Grandmaster' : cap(rank);
    expect(getLevelInfo(level).title).toBe(`${english} ${step}`);
  }
});

it('translates the rank and keeps the numeral', () => {
  const t = (key: string) => (key === 'gamification.levels.rank.apprentice' ? 'Lehrling' : key);
  expect(rankTitle(17, t)).toBe('Lehrling II');
});
