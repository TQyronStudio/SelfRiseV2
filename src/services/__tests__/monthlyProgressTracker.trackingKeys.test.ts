// Monthly Challenge Progress Tracking — Tracking Key Regression Suite
//
// WHY THIS EXISTS (audit, July 2026): 7 of 14 challenge templates silently
// never progressed — the user completed activities, the app said "challenge
// active", but progress stayed at 0% and the month ended in a failure modal
// with a star demotion. Three independent root causes:
//   (A) `habit_streak_days` and `avg_entry_length` had no case in
//       getRelevantRequirements → events were discarded before calculation.
//   (B) Complex/derived keys (perfect_days, triple_feature_days,
//       monthly_xp_total, balance_score, avg_entry_length) have per-event
//       increments of 0, but the update pipeline (incl. the recalculation
//       that computes them) only ran when an increment was non-zero.
//   (C) `unique_weekly_habits` reads metadata.sourceId, but XP events carry
//       sourceId as a separate field — it was dropped before reaching the
//       increment calculator.
//
// This suite drives ONE XP event pipeline per template tracking key and
// asserts that progress actually moves. If any of these tests fails, a whole
// challenge type is dead in production — treat as release blocker.

import { MonthlyProgressTracker } from '../monthlyProgressTracker';
import {
  MonthlyChallenge,
  XPSourceType,
  AchievementCategory,
} from '../../types/gamification';
import { today, formatDateToString } from '../../utils/date';
import { GamificationService } from '../gamificationService';
import { MonthlyChallengeService } from '../monthlyChallengeService';
import { gratitudeStorage } from '../storage/gratitudeStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ========================================
// MOCKS
// ========================================

jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native', () => ({
  DeviceEventEmitter: {
    emit: jest.fn(),
    addListener: jest.fn(),
  },
}));

// Force the legacy AsyncStorage code paths — SQLite is unavailable in Jest.
// The storage helpers must be mocked too: services now resolve their storage
// through them (never via a hardcoded legacy singleton), so omitting them here
// makes the module under test crash on import.
jest.mock('../../config/featureFlags', () => ({
  FEATURE_FLAGS: {
    USE_SQLITE_JOURNAL: false,
    USE_SQLITE_HABITS: false,
    USE_SQLITE_GOALS: false,
    USE_SQLITE_GAMIFICATION: false,
    USE_SQLITE_CHALLENGES: false,
  },
  getGratitudeStorageImpl: () => require('../storage/gratitudeStorage').gratitudeStorage,
  getHabitStorageImpl: () => require('../storage/habitStorage').habitStorage,
  getGoalStorageImpl: () => require('../storage/goalStorage').goalStorage,
}));
jest.mock('../storage/SQLiteChallengeStorage', () => ({
  sqliteChallengeStorage: {},
}));

// avg_entry_length reads entries via getAll() and filters by the DateString range
// itself (no getEntriesInRange, no Date round-trip → no timezone shift).
jest.mock('../storage/gratitudeStorage', () => ({
  gratitudeStorage: {
    getAll: jest.fn(async () => []),
  },
}));

// The tracker derives snapshot facts (isPerfectDay, isTripleFeatureDay,
// xpEarnedToday) from GamificationService.getTransactionsByDateRange.
jest.mock('../gamificationService', () => ({
  GamificationService: {
    getTransactionsByDateRange: jest.fn(async () => []),
    addXP: jest.fn(async () => ({ success: true })),
  },
}));

jest.mock('../starRatingService', () => ({
  StarRatingService: {
    updateStarRatingForCompletion: jest.fn(async () => ({
      previousStars: 1,
      newStars: 2,
      reason: 'success',
    })),
  },
}));

jest.mock('../monthlyChallengeService', () => ({
  MonthlyChallengeService: {
    getCurrentChallenge: jest.fn(async () => null),
    getChallengeForMonth: jest.fn(async () => null),
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGetCurrentChallenge = MonthlyChallengeService.getCurrentChallenge as jest.Mock;
const mockGetTransactions = GamificationService.getTransactionsByDateRange as jest.Mock;
const mockGetAllJournalEntries = gratitudeStorage.getAll as jest.Mock;

// ========================================
// TEST HELPERS
// ========================================

/** First and last day of the current LOCAL month (challenge date range). */
function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = formatDateToString(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = formatDateToString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { start, end };
}

function makeChallenge(
  trackingKey: string,
  target: number,
  category: AchievementCategory,
  requirementType: 'habits' | 'journal' | 'goals' | 'consistency',
  starLevel: 1 | 2 | 3 | 4 | 5 = 1
): MonthlyChallenge {
  const { start, end } = currentMonthRange();
  return {
    id: `test_challenge_${trackingKey}`,
    title: `Test Challenge: ${trackingKey}`,
    description: 'Regression test challenge',
    startDate: start,
    endDate: end,
    baseXPReward: 500,
    starLevel,
    category,
    requirements: [
      {
        type: requirementType,
        target,
        description: `Reach ${target} of ${trackingKey}`,
        trackingKey,
        baselineValue: target,
        scalingMultiplier: 1.05,
        progressMilestones: [25, 50, 75],
      },
    ],
    userBaselineSnapshot: {
      month: start.substring(0, 7),
      analysisStartDate: start,
      analysisEndDate: end,
      dataQuality: 'complete',
      totalActiveDays: 25,
    },
    scalingFormula: 'baseline * 1.05',
    isActive: true,
    generationReason: 'scheduled',
    categoryRotation: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** Install a challenge as the active one and return it. */
function activateChallenge(challenge: MonthlyChallenge): MonthlyChallenge {
  mockGetCurrentChallenge.mockResolvedValue(challenge);
  return challenge;
}

async function getProgressValue(challengeId: string, trackingKey: string): Promise<number> {
  const progress = await MonthlyProgressTracker.getChallengeProgress(challengeId);
  return progress?.progress?.[trackingKey] ?? 0;
}

async function getCompletionPercentage(challengeId: string): Promise<number> {
  const progress = await MonthlyProgressTracker.getChallengeProgress(challengeId);
  return progress?.completionPercentage ?? 0;
}

/** A minimal XP transaction shape as consumed by getDailyXPTransactions. */
function tx(source: XPSourceType, amount: number) {
  return {
    id: `tx_${Math.random().toString(36).slice(2)}`,
    amount,
    source,
    description: 'test',
    date: today(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ========================================
// SETUP
// ========================================

describe('MonthlyProgressTracker — tracking key regression suite (all 14 templates)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Fresh in-memory AsyncStorage per test
    const storage = new Map<string, string>();
    mockAsyncStorage.getItem.mockImplementation(async (key) => storage.get(key) || null);
    mockAsyncStorage.setItem.mockImplementation(async (key, value) => {
      storage.set(key, value);
    });
    mockAsyncStorage.removeItem.mockImplementation(async (key) => {
      storage.delete(key);
    });
    mockAsyncStorage.multiRemove.mockImplementation(async (keys) => {
      keys.forEach((key) => storage.delete(key));
    });

    // Default mock data
    mockGetCurrentChallenge.mockResolvedValue(null);
    mockGetTransactions.mockResolvedValue([]);
    mockGetAllJournalEntries.mockResolvedValue([]);

    // Reset the tracker's static in-memory state — streak/variety caches and
    // progress caches would otherwise leak between tests (singleton pattern).
    const T = MonthlyProgressTracker as any;
    T.progressCache = new Map();
    T.snapshotsCache = null;
    T.updateQueues = new Map();
    T.currentWeekHabits = new Set();
    T.currentWeekNumber = 0;
    T.streakCompletedToday = false;
    T.currentStreakDate = '';
    T.currentStreakDays = 0;
    T.journalStreakCompletedToday = false;
    T.currentJournalStreakDate = '';
    T.currentJournalStreakDays = 0;
    T.todayJournalEntriesCount = 0;
    T.journalCountDate = '';
    T.goalProgressCountedDate = '';
  });

  // ========================================
  // HABITS TEMPLATES (4)
  // ========================================

  test('scheduled_habit_completions (Consistency Master): habit completion → +1', async () => {
    const ch = activateChallenge(
      makeChallenge('scheduled_habit_completions', 30, AchievementCategory.HABITS, 'habits')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25, 'habit-1');

    expect(await getProgressValue(ch.id, 'scheduled_habit_completions')).toBe(1);
    expect(await getCompletionPercentage(ch.id)).toBeGreaterThan(0);
  });

  test('bonus_habit_completions (Bonus Hunter): bonus habit → +1, scheduled habit → no change', async () => {
    const ch = activateChallenge(
      makeChallenge('bonus_habit_completions', 15, AchievementCategory.HABITS, 'habits')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_BONUS, 15, 'habit-1');
    expect(await getProgressValue(ch.id, 'bonus_habit_completions')).toBe(1);

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25, 'habit-1');
    expect(await getProgressValue(ch.id, 'bonus_habit_completions')).toBe(1);
  });

  test('unique_weekly_habits (Variety Champion): top-level sourceId reaches the calculator [Fix C]', async () => {
    const ch = activateChallenge(
      makeChallenge('unique_weekly_habits', 10, AchievementCategory.HABITS, 'habits')
    );

    // sourceId passed as 4th-arg style top-level field (metadata undefined),
    // exactly how habit storage emits it — previously variety never counted.
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25, 'habit-A');
    expect(await getProgressValue(ch.id, 'unique_weekly_habits')).toBe(1);

    // Same habit again this week → still unique count 1
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25, 'habit-A');
    expect(await getProgressValue(ch.id, 'unique_weekly_habits')).toBe(1);

    // A different habit → 2
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25, 'habit-B');
    expect(await getProgressValue(ch.id, 'unique_weekly_habits')).toBe(2);
  });

  test('habit_streak_days (Streak Builder): habit completion is no longer filtered out [Fix A]', async () => {
    const ch = activateChallenge(
      makeChallenge('habit_streak_days', 20, AchievementCategory.HABITS, 'habits')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25, 'habit-1');

    // First completion of the day starts/extends the streak → 1
    expect(await getProgressValue(ch.id, 'habit_streak_days')).toBe(1);
    expect(await getCompletionPercentage(ch.id)).toBeGreaterThan(0);
  });

  // ========================================
  // JOURNAL TEMPLATES (4)
  // ========================================

  test('quality_journal_entries (Reflection Expert): 33+ chars counts, shorter does not', async () => {
    const ch = activateChallenge(
      makeChallenge('quality_journal_entries', 80, AchievementCategory.JOURNAL, 'journal')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(
      XPSourceType.JOURNAL_ENTRY, 20, 'entry-1', { entryLength: 50 }
    );
    expect(await getProgressValue(ch.id, 'quality_journal_entries')).toBe(1);

    await MonthlyProgressTracker.updateMonthlyProgress(
      XPSourceType.JOURNAL_ENTRY, 20, 'entry-2', { entryLength: 10 }
    );
    expect(await getProgressValue(ch.id, 'quality_journal_entries')).toBe(1);
  });

  test('total_journal_entries_with_bonus (Gratitude Guru): regular + bonus both count', async () => {
    const ch = activateChallenge(
      makeChallenge('total_journal_entries_with_bonus', 100, AchievementCategory.JOURNAL, 'journal')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.JOURNAL_ENTRY, 20, 'entry-1');
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.JOURNAL_BONUS, 8, 'entry-2');

    expect(await getProgressValue(ch.id, 'total_journal_entries_with_bonus')).toBe(2);
  });

  test('daily_journal_streak (Consistency Writer, 1⭐ = 1 entry/day): first entry today → streak 1', async () => {
    const ch = activateChallenge(
      makeChallenge('daily_journal_streak', 25, AchievementCategory.JOURNAL, 'journal', 1)
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.JOURNAL_ENTRY, 20, 'entry-1');

    expect(await getProgressValue(ch.id, 'daily_journal_streak')).toBe(1);
  });

  test('avg_entry_length (Depth Explorer): journal event triggers recalculation [Fix A+B]', async () => {
    const ch = activateChallenge(
      makeChallenge('avg_entry_length', 100, AchievementCategory.JOURNAL, 'journal')
    );

    // The tracker reads ALL entries and filters them to the challenge's date range
    // itself, so the out-of-range entry below must NOT drag the average down.
    const { start } = currentMonthRange();
    mockGetAllJournalEntries.mockResolvedValue([
      { content: 'x'.repeat(40), date: start },
      { content: 'y'.repeat(60), date: start },
      { content: 'z'.repeat(1000), date: '2020-01-01' }, // before the challenge → ignored
    ]);

    await MonthlyProgressTracker.updateMonthlyProgress(
      XPSourceType.JOURNAL_ENTRY, 20, 'entry-1', { entryLength: 60 }
    );

    // Average of 40 and 60 = 50 (the 1000-char entry from 2020 is out of range)
    expect(await getProgressValue(ch.id, 'avg_entry_length')).toBe(50);
    expect(await getCompletionPercentage(ch.id)).toBeGreaterThan(0);
  });

  // ========================================
  // GOALS TEMPLATES (2)
  // ========================================

  test('daily_goal_progress (Progress Champion): counts DAYS, not events [July 2026 fix]', async () => {
    const ch = activateChallenge(
      makeChallenge('daily_goal_progress', 20, AchievementCategory.GOALS, 'goals')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, 35, 'goal-1');
    expect(await getProgressValue(ch.id, 'daily_goal_progress')).toBe(1);

    // Second and third goal-progress the SAME day (other goals) must NOT
    // add more "days" — previously 3 goals × 3 updates counted as 9 days
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, 35, 'goal-2');
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, 35, 'goal-3');
    expect(await getProgressValue(ch.id, 'daily_goal_progress')).toBe(1);

    // Undo of today's counted progress releases the day (and not below 0)
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, -35, 'goal-1');
    expect(await getProgressValue(ch.id, 'daily_goal_progress')).toBe(0);
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, -35, 'goal-2');
    expect(await getProgressValue(ch.id, 'daily_goal_progress')).toBe(0);

    // New progress after undo counts the day again
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, 35, 'goal-1');
    expect(await getProgressValue(ch.id, 'daily_goal_progress')).toBe(1);
  });

  test('goal_completions (Completion Master): goal completion → +1', async () => {
    const ch = activateChallenge(
      makeChallenge('goal_completions', 3, AchievementCategory.GOALS, 'goals')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_COMPLETION, 250, 'goal-1');

    expect(await getProgressValue(ch.id, 'goal_completions')).toBe(1);
  });

  // ========================================
  // CONSISTENCY TEMPLATES (4) — complex/derived keys [Fix B]
  // ========================================

  test('triple_feature_days (Triple Master): day with all 3 features → 1 [Fix B]', async () => {
    const ch = activateChallenge(
      makeChallenge('triple_feature_days', 15, AchievementCategory.CONSISTENCY, 'consistency')
    );
    // Today's transaction history shows all three features used
    mockGetTransactions.mockResolvedValue([
      tx(XPSourceType.HABIT_COMPLETION, 25),
      tx(XPSourceType.JOURNAL_ENTRY, 20),
      tx(XPSourceType.GOAL_PROGRESS, 35),
    ]);

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, 35, 'goal-1');

    expect(await getProgressValue(ch.id, 'triple_feature_days')).toBe(1);
    expect(await getCompletionPercentage(ch.id)).toBeGreaterThan(0);
  });

  test('perfect_days (Perfect Month): 1+ habit & 3+ journal today → 1 [Fix B]', async () => {
    const ch = activateChallenge(
      makeChallenge('perfect_days', 20, AchievementCategory.CONSISTENCY, 'consistency')
    );
    mockGetTransactions.mockResolvedValue([
      tx(XPSourceType.HABIT_COMPLETION, 25),
      tx(XPSourceType.JOURNAL_ENTRY, 20),
      tx(XPSourceType.JOURNAL_ENTRY, 20),
      tx(XPSourceType.JOURNAL_ENTRY, 20),
    ]);

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.JOURNAL_ENTRY, 20, 'entry-3');

    expect(await getProgressValue(ch.id, 'perfect_days')).toBe(1);
  });

  test('monthly_xp_total (XP Champion): daily XP flows into the monthly total [Fix B]', async () => {
    const ch = activateChallenge(
      makeChallenge('monthly_xp_total', 2000, AchievementCategory.CONSISTENCY, 'consistency')
    );
    mockGetTransactions.mockResolvedValue([
      tx(XPSourceType.HABIT_COMPLETION, 25),
      tx(XPSourceType.JOURNAL_ENTRY, 20),
      tx(XPSourceType.GOAL_PROGRESS, 50),
    ]);

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.GOAL_PROGRESS, 50, 'goal-1');

    // xpEarnedToday snapshot = 25 + 20 + 50 = 95
    expect(await getProgressValue(ch.id, 'monthly_xp_total')).toBe(95);
    expect(await getCompletionPercentage(ch.id)).toBeGreaterThan(0);
  });

  test('balance_score (Balance Expert): balanced sources produce a non-zero score [Fix B]', async () => {
    const ch = activateChallenge(
      makeChallenge('balance_score', 0.8, AchievementCategory.CONSISTENCY, 'consistency', 4)
    );
    mockGetTransactions.mockResolvedValue([
      tx(XPSourceType.HABIT_COMPLETION, 30),
      tx(XPSourceType.JOURNAL_ENTRY, 30),
      tx(XPSourceType.GOAL_PROGRESS, 30),
    ]);

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 30, 'habit-1');

    expect(await getProgressValue(ch.id, 'balance_score')).toBeGreaterThan(0);
  });

  // ========================================
  // CROSS-CUTTING GUARANTEES
  // ========================================

  test('every template tracking key is matched by at least one XP source (no dead templates)', async () => {
    // The canonical list of tracking keys used by MonthlyChallengeService templates.
    const templateKeys: Array<{ key: string; source: XPSourceType }> = [
      { key: 'scheduled_habit_completions', source: XPSourceType.HABIT_COMPLETION },
      { key: 'unique_weekly_habits', source: XPSourceType.HABIT_COMPLETION },
      { key: 'habit_streak_days', source: XPSourceType.HABIT_COMPLETION },
      { key: 'bonus_habit_completions', source: XPSourceType.HABIT_BONUS },
      { key: 'quality_journal_entries', source: XPSourceType.JOURNAL_ENTRY },
      { key: 'total_journal_entries_with_bonus', source: XPSourceType.JOURNAL_ENTRY },
      { key: 'daily_journal_streak', source: XPSourceType.JOURNAL_ENTRY },
      { key: 'avg_entry_length', source: XPSourceType.JOURNAL_ENTRY },
      { key: 'daily_goal_progress', source: XPSourceType.GOAL_PROGRESS },
      { key: 'goal_completions', source: XPSourceType.GOAL_COMPLETION },
      { key: 'triple_feature_days', source: XPSourceType.HABIT_COMPLETION },
      { key: 'perfect_days', source: XPSourceType.HABIT_COMPLETION },
      { key: 'monthly_xp_total', source: XPSourceType.HABIT_COMPLETION },
      { key: 'balance_score', source: XPSourceType.HABIT_COMPLETION },
    ];

    const T = MonthlyProgressTracker as any;
    for (const { key, source } of templateKeys) {
      const challenge = makeChallenge(key, 100, AchievementCategory.CONSISTENCY, 'consistency');
      const relevant = T.getRelevantRequirements(challenge, source);
      expect({ key, matched: relevant.length > 0 }).toEqual({ key, matched: true });
    }
  });

  test('negative XP (undo) decrements simple counters but never below 0', async () => {
    const ch = activateChallenge(
      makeChallenge('scheduled_habit_completions', 30, AchievementCategory.HABITS, 'habits')
    );

    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, 25, 'habit-1');
    expect(await getProgressValue(ch.id, 'scheduled_habit_completions')).toBe(1);

    // Undo
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, -25, 'habit-1');
    expect(await getProgressValue(ch.id, 'scheduled_habit_completions')).toBe(0);

    // A second undo must not go below zero
    await MonthlyProgressTracker.updateMonthlyProgress(XPSourceType.HABIT_COMPLETION, -25, 'habit-1');
    expect(await getProgressValue(ch.id, 'scheduled_habit_completions')).toBe(0);
  });
});
