// Monthly challenge: month-streak bonus and milestone amounts — Regression Suite
//
// WHY THIS EXISTS (November 12, 2026 — found while redesigning the challenge):
//  1. The month-streak bonus (+5/10/15/25 % of the base XP) was NEVER paid. The
//     completion code read `progress.currentStreak`, which is initialised to 0
//     and never written, so the bonus was always 0 and the completion window
//     always said "1 month". The streak is now counted from the stored
//     challenges (month + final status).
//  2. Milestones paid 55/110/165 XP instead of 50/100/150 to most users: an
//     "activity" multiplier compared active DAYS with the milestone PERCENT.
//     The screen names the amounts in advance, so they must be exact.
//
// The storage part runs against the real in-memory SQLite (global jest setup).

import { DeviceEventEmitter } from 'react-native';
import {
  completedMonthsInRowBefore,
  monthStreakBonusShare,
  previousMonth,
} from '../monthlyStreak';
import { MonthlyChallengeService } from '../monthlyChallengeService';
import { MonthlyProgressTracker } from '../monthlyProgressTracker';
import { StarRatingService } from '../starRatingService';
import { GamificationService } from '../gamificationService';
import { AchievementCategory, XPSourceType } from '../../types/gamification';
import { getDatabase } from '../database/init';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
  },
}));

const mockEmit = DeviceEventEmitter.emit as jest.Mock;

describe('month streak: counting months in a row', () => {
  const done = (month: string) => ({ month, status: 'completed' });
  const failed = (month: string) => ({ month, status: 'failed' });

  it('steps back over a year boundary', () => {
    expect(previousMonth('2026-06')).toBe('2026-05');
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(previousMonth('nonsense')).toBe('');
  });

  it('counts completed months directly before the given one', () => {
    const history = [done('2026-05'), done('2026-04'), done('2026-03')];
    expect(completedMonthsInRowBefore('2026-06', history)).toBe(3);
  });

  it('ends the row at a month that was not completed', () => {
    const history = [done('2026-05'), failed('2026-04'), done('2026-03')];
    expect(completedMonthsInRowBefore('2026-06', history)).toBe(1);
  });

  it('ends the row at a month without any challenge', () => {
    const history = [done('2026-05'), done('2026-03')];
    expect(completedMonthsInRowBefore('2026-06', history)).toBe(1);
  });

  it('is zero when the month before was missed, whatever came earlier', () => {
    const history = [failed('2026-05'), done('2026-04'), done('2026-03')];
    expect(completedMonthsInRowBefore('2026-06', history)).toBe(0);
    expect(completedMonthsInRowBefore('2026-06', [])).toBe(0);
  });

  it('ignores the month itself and anything after it', () => {
    const history = [done('2026-07'), done('2026-06'), done('2026-05')];
    expect(completedMonthsInRowBefore('2026-06', history)).toBe(1);
  });

  it('does not care about the category — any completed challenge counts', () => {
    // The category rotates every month; the streak is about months.
    const history = [done('2026-05'), done('2026-04')];
    expect(completedMonthsInRowBefore('2026-06', history)).toBe(2);
  });
});

describe('month streak: the bonus share', () => {
  it('follows the guide: nothing for the first month, then 5/10/15/25 %', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 11, 12, 40].map(monthStreakBonusShare)).toEqual(
      [0, 0, 0.05, 0.05, 0.1, 0.1, 0.15, 0.15, 0.25, 0.25]
    );
  });
});

describe('month streak: read from the stored challenges', () => {
  async function insert(month: string, status: string) {
    await getDatabase().runAsync(
      `INSERT INTO monthly_challenges (
        id, month, category, template_id, title, description, star_level,
        base_xp_reward, status, progress, created_at, updated_at
      ) VALUES (?, ?, 'habits', 'habits_consistency_master', 't', 'd', 3, 12000, ?, 100, ?, ?)`,
      [`streak_test_${month}`, month, status, Date.now(), Date.now()]
    );
  }

  beforeEach(async () => {
    await getDatabase().runAsync(
      "DELETE FROM monthly_challenges WHERE id LIKE 'streak_test_%'"
    );
  });
  afterAll(async () => {
    await getDatabase().runAsync(
      "DELETE FROM monthly_challenges WHERE id LIKE 'streak_test_%'"
    );
  });

  it('counts three completed months before June', async () => {
    await insert('2026-03', 'completed');
    await insert('2026-04', 'completed');
    await insert('2026-05', 'completed');
    await insert('2026-06', 'active');
    await expect(
      MonthlyChallengeService.getCompletedMonthsInRowBefore('2026-06')
    ).resolves.toBe(3);
  });

  it('stops at a failed month', async () => {
    await insert('2026-03', 'completed');
    await insert('2026-04', 'failed');
    await insert('2026-05', 'completed');
    await expect(
      MonthlyChallengeService.getCompletedMonthsInRowBefore('2026-06')
    ).resolves.toBe(1);
  });

  it('is zero for a first challenge', async () => {
    await expect(
      MonthlyChallengeService.getCompletedMonthsInRowBefore('2026-06')
    ).resolves.toBe(0);
  });
});

describe('completing a challenge pays the month-streak bonus', () => {
  let addXPSpy: jest.SpyInstance;
  let streakSpy: jest.SpyInstance;

  function arrange(monthsBefore: number, baseXPReward: number) {
    jest.spyOn(MonthlyProgressTracker, 'getChallengeProgress').mockResolvedValue({
      challengeId: 'c1',
      progress: {},
      isCompleted: false,
      completionPercentage: 100,
      daysActive: 20,
      activeDays: [],
      milestonesReached: {},
      currentStreak: 0,
      xpEarned: 0,
    } as any);
    jest.spyOn(MonthlyProgressTracker as any, 'getChallengeById').mockResolvedValue({
      id: 'c1',
      title: 'Consistency Master',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      baseXPReward,
      starLevel: 3,
      category: AchievementCategory.HABITS,
      requirements: [],
      generationReason: 'scheduled',
    } as any);
    streakSpy = jest
      .spyOn(MonthlyChallengeService, 'getCompletedMonthsInRowBefore')
      .mockResolvedValue(monthsBefore);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    addXPSpy = jest.spyOn(GamificationService, 'addXP').mockResolvedValue({ success: true } as any);
    jest.spyOn(GamificationService, 'updateMonthlyStreak').mockResolvedValue(undefined as any);
    jest.spyOn(StarRatingService, 'updateStarRatingForCompletion').mockResolvedValue({
      previousStars: 3, newStars: 4, reason: 'success',
    } as any);
    jest.spyOn(MonthlyProgressTracker, 'saveProgressState').mockResolvedValue(undefined);
    jest.spyOn(MonthlyChallengeService, 'archiveCompletedChallenge').mockResolvedValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  const complete = () => (MonthlyProgressTracker as any).completeMonthlyChallenge('c1');
  const completionEvent = () =>
    mockEmit.mock.calls.find(([name]) => name === 'monthly_challenge_completed')?.[1];

  it('adds 10 % for the fourth month in a row and reports the streak', async () => {
    arrange(3, 12000);
    await complete();

    expect(streakSpy).toHaveBeenCalledWith('2026-06');
    expect(addXPSpy).toHaveBeenCalledTimes(1);
    expect(addXPSpy).toHaveBeenCalledWith(
      13200,
      expect.objectContaining({
        source: XPSourceType.MONTHLY_CHALLENGE,
        metadata: expect.objectContaining({ baseReward: 12000, streakBonus: 1200, streak: 4 }),
      })
    );
    expect(completionEvent()).toMatchObject({
      baseXP: 12000,
      streakBonus: 1200,
      totalXPEarned: 13200,
      monthlyStreak: 4,
    });
  });

  it('pays the base alone for a first month', async () => {
    arrange(0, 7500);
    await complete();
    expect(addXPSpy).toHaveBeenCalledWith(7500, expect.anything());
    expect(completionEvent()).toMatchObject({ streakBonus: 0, monthlyStreak: 1 });
  });

  it('pays 5 % from the second month in a row', async () => {
    arrange(1, 5000);
    await complete();
    expect(addXPSpy).toHaveBeenCalledWith(5250, expect.anything());
    expect(completionEvent()).toMatchObject({ streakBonus: 250, monthlyStreak: 2 });
  });
});

describe('challenge milestones pay exactly what the screen says', () => {
  const pay = (milestone: number, progress: object) =>
    (MonthlyProgressTracker as any).calculateMilestoneXPBonus(milestone, progress);

  it('50 / 100 / 150 XP', () => {
    const quiet = { dailyConsistency: 0, daysActive: 0 };
    expect([pay(25, quiet), pay(50, quiet), pay(75, quiet)]).toEqual([50, 100, 150]);
  });

  it('the same for a very active, very consistent user', () => {
    const busy = { dailyConsistency: 1, daysActive: 30 };
    expect([pay(25, busy), pay(50, busy), pay(75, busy)]).toEqual([50, 100, 150]);
  });
});
