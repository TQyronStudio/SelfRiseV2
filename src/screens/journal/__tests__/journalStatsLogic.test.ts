import { Gratitude } from '@/src/types/gratitude';
import {
  chartSummary,
  lastDaysCounts,
  milestoneOfCount,
  streakNote,
  typeSplit,
} from '../journalStatsLogic';

const e = (date: string, type: 'gratitude' | 'self-praise' = 'gratitude') =>
  ({ id: `${date}-${Math.random()}`, date, type, content: 'x' }) as unknown as Gratitude;

describe('lastDaysCounts', () => {
  it('counts each of the last days, oldest first, today last', () => {
    const counts = lastDaysCounts([e('2026-11-25'), e('2026-11-25'), e('2026-11-23')], '2026-11-25', 3);
    expect(counts).toEqual([
      { date: '2026-11-23', count: 1 },
      { date: '2026-11-24', count: 0 },
      { date: '2026-11-25', count: 2 },
    ]);
  });
});

describe('chartSummary', () => {
  it('days at the goal and the average over all days', () => {
    expect(chartSummary([3, 0, 5, 2])).toEqual({ atGoal: 2, average: 2.5 });
  });
});

describe('milestoneOfCount', () => {
  it('⭐ from 4, 🔥 from 8, 👑 from 13', () => {
    expect([3, 4, 7, 8, 12, 13].map(milestoneOfCount)).toEqual([
      null,
      'star',
      'star',
      'flame',
      'flame',
      'crown',
    ]);
  });
});

describe('typeSplit', () => {
  it('gratitude vs self-praise', () => {
    expect(typeSplit([e('2026-11-25'), e('2026-11-25', 'self-praise')])).toEqual({
      gratitude: 1,
      selfPraise: 1,
    });
  });
});

describe('streakNote (E13/1)', () => {
  it('no streak ever: start today, never "Best: 0 days"', () => {
    expect(streakNote(0, 0)).toBe('startToday');
  });
  it('a new record, or the best run', () => {
    expect(streakNote(31, 31)).toBe('personalBest');
    expect(streakNote(24, 31)).toBe('best');
    expect(streakNote(0, 31)).toBe('best');
  });
});
