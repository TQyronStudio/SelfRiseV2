// "XP today" — the number shown on Home and in the level panel
//
// WHY THIS EXISTS (November 16, 2026): the new design shows how much XP the user
// earned today. The app already kept that number for the daily limits, but had no
// public way to read it. getTodayXP() exposes it for display; it must agree with
// what was really credited and can never go below zero.
//
// Runs against the real in-memory SQLite (global jest setup).

import { GamificationService } from '../../../src/services/gamificationService';
import { getDatabase } from '../../../src/services/database/init';
import { XPSourceType } from '../../../src/types/gamification';
import { today } from '../../../src/utils/date';

describe('GamificationService.getTodayXP', () => {
  beforeEach(async () => {
    await GamificationService.clearAllData();
  });

  it('is zero before anything was earned today', async () => {
    await expect(GamificationService.getTodayXP()).resolves.toBe(0);
  });

  it('adds up what was credited today across sources', async () => {
    await GamificationService.addXP(25, {
      source: XPSourceType.HABIT_COMPLETION,
      sourceId: 'habit-1',
      description: 'habit',
    });
    await GamificationService.addXP(20, {
      source: XPSourceType.JOURNAL_ENTRY,
      description: 'journal',
    });
    await GamificationService.addXP(100, {
      source: XPSourceType.ACHIEVEMENT_UNLOCK,
      description: 'trophy',
    });

    await expect(GamificationService.getTodayXP()).resolves.toBe(145);
    // The same amount the user's total grew by.
    await expect(GamificationService.getTotalXP()).resolves.toBe(145);
  });

  it('goes down when XP is taken back', async () => {
    await GamificationService.addXP(25, {
      source: XPSourceType.HABIT_COMPLETION,
      sourceId: 'habit-1',
      description: 'habit',
    });
    await GamificationService.subtractXP(25, {
      source: XPSourceType.HABIT_COMPLETION,
      sourceId: 'habit-1',
      description: 'habit undone',
    });

    await expect(GamificationService.getTodayXP()).resolves.toBe(0);
  });

  it('never shows a negative number', async () => {
    // XP earned yesterday and taken back today leaves today's record below zero.
    // Written straight into the daily record: this is about what is SHOWN.
    await getDatabase().runAsync(
      `INSERT OR REPLACE INTO xp_daily_summary
         (date, total_xp, habit_xp, journal_xp, goal_xp, achievement_xp, transaction_count, updated_at)
       VALUES (?, -40, -40, 0, 0, 0, 1, ?)`,
      [today(), Date.now()]
    );

    await expect(GamificationService.getTodayXP()).resolves.toBe(0);
  });
});
