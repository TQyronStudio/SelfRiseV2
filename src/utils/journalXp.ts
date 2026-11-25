/**
 * What a journal entry is worth by its place in the day — the ONE rule
 * (SQLiteGratitudeStorage awards and refunds by it; the Journal screen shows it
 * on the writing tiles and in the sheet, migration E12). Tested in
 * __tests__/journalXp.test.ts.
 *
 *   1–3   the daily three (FIRST/SECOND/THIRD_ENTRY)
 *   4–13  bonus entries (BONUS_ENTRY), with ⭐ at 4, 🔥 at 8, 👑 at 13 on top
 *   14+   nothing (spam prevention)
 */
import { XP_REWARDS } from '../constants/gamification';

/** Entries a day that keep the streak (and complete the day). */
export const JOURNAL_DAILY_GOAL = 3;

export type JournalMilestone = 'star' | 'flame' | 'crown';

/** The milestone a daily position earns, if any: ⭐ 4, 🔥 8, 👑 13. */
export function journalMilestoneAt(position: number): JournalMilestone | null {
  switch (position) {
    case 4:
      return 'star';
    case 8:
      return 'flame';
    case 13:
      return 'crown';
    default:
      return null;
  }
}

/** Milestone XP of a daily position (on top of the entry's own XP). */
export function journalMilestoneXp(position: number): number {
  switch (position) {
    case 4:
      return XP_REWARDS.JOURNAL.FIRST_BONUS_MILESTONE;
    case 8:
      return XP_REWARDS.JOURNAL.FIFTH_BONUS_MILESTONE;
    case 13:
      return XP_REWARDS.JOURNAL.TENTH_BONUS_MILESTONE;
    default:
      return 0;
  }
}

/** The entry's own XP by its daily position. */
export function journalEntryXp(position: number): number {
  switch (position) {
    case 1:
      return XP_REWARDS.JOURNAL.FIRST_ENTRY;
    case 2:
      return XP_REWARDS.JOURNAL.SECOND_ENTRY;
    case 3:
      return XP_REWARDS.JOURNAL.THIRD_ENTRY;
    default:
      return position >= 4 && position <= 13
        ? XP_REWARDS.JOURNAL.BONUS_ENTRY
        : XP_REWARDS.JOURNAL.FOURTEENTH_PLUS_ENTRY;
  }
}

/** Everything a new entry at this position earns. */
export function journalPositionXp(position: number): number {
  return journalEntryXp(position) + journalMilestoneXp(position);
}
