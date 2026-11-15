// Journal streak milestones — which days are celebrated, and with what texts
//
// ONE place for both: the journal screen decides WHEN to celebrate from this
// list, the celebration modal picks the texts here. The two used to live apart
// (journal.tsx celebrated 17 days, CelebrationModal knew texts for 6) and on
// the other 11 days the modal showed the raw key
// "journal.streakMilestone75_title" (tester, 2026-10-19).

import i18next from 'i18next';
import { XP_REWARDS } from '../constants/gamification';

/** Streak lengths (days) that trigger the journal streak celebration. */
export const JOURNAL_STREAK_MILESTONES = [
  7, 14, 21, 30, 50, 60, 75, 90, 100, 150, 180, 200, 250, 365, 500, 750, 1000,
] as const;

export function isJournalStreakMilestone(streakDays: number): boolean {
  return (JOURNAL_STREAK_MILESTONES as readonly number[]).includes(streakDays);
}

/**
 * XP paid the day the journal streak reaches a length. Five of the celebrated
 * lengths pay; the others are a celebration only.
 *
 * Until 2026-11-14 these values sat unused in XP_REWARDS — nothing paid them.
 * The payout lives in SQLiteGratitudeStorage (awardStreakReward), once per
 * streak run; see technical-guides:My-Journal.md.
 */
export const JOURNAL_STREAK_REWARDS: Readonly<Record<number, number>> = {
  7: XP_REWARDS.JOURNAL.STREAK_7_DAYS,
  21: XP_REWARDS.JOURNAL.STREAK_21_DAYS,
  30: XP_REWARDS.JOURNAL.STREAK_30_DAYS,
  100: XP_REWARDS.JOURNAL.STREAK_100_DAYS,
  365: XP_REWARDS.JOURNAL.STREAK_365_DAYS,
};

/** XP for reaching this streak length; 0 when the length pays nothing. */
export function getJournalStreakReward(streakDays: number): number {
  return JOURNAL_STREAK_REWARDS[streakDays] ?? 0;
}

/**
 * Title and message for a streak milestone in the current language.
 *
 * A milestone with its own texts in the locale (`journal.streakMilestone<N>_title`
 * + `_text`) uses them; any other day gets the generic texts with the day count.
 * Decided by the locale itself (i18next.exists), so adding texts for a new
 * milestone needs no code change.
 */
export function getJournalStreakMilestoneTexts(streakDays: number): { title: string; message: string } {
  const specialKey = `journal.streakMilestone${streakDays}`;
  const hasOwnTexts = i18next.exists(`${specialKey}_title`) && i18next.exists(`${specialKey}_text`);

  if (hasOwnTexts) {
    return {
      title: i18next.t(`${specialKey}_title`),
      message: i18next.t(`${specialKey}_text`),
    };
  }

  return {
    title: i18next.t('journal.streakMilestone_generic_title'),
    message: i18next.t('journal.streakMilestone_generic_text', { days: streakDays }),
  };
}
