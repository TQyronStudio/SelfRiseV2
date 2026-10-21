// Journal streak milestones — which days are celebrated, and with what texts
//
// ONE place for both: the journal screen decides WHEN to celebrate from this
// list, the celebration modal picks the texts here. The two used to live apart
// (journal.tsx celebrated 17 days, CelebrationModal knew texts for 6) and on
// the other 11 days the modal showed the raw key
// "journal.streakMilestone75_title" (tester, 2026-10-19).

import i18next from 'i18next';

/** Streak lengths (days) that trigger the journal streak celebration. */
export const JOURNAL_STREAK_MILESTONES = [
  7, 14, 21, 30, 50, 60, 75, 90, 100, 150, 180, 200, 250, 365, 500, 750, 1000,
] as const;

export function isJournalStreakMilestone(streakDays: number): boolean {
  return (JOURNAL_STREAK_MILESTONES as readonly number[]).includes(streakDays);
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
